"""Ship a locally built release to the existing, single-node K3s demos namespace."""
import argparse
import base64
import gzip
import hashlib
import json
from pathlib import Path
import shlex
import shutil
import subprocess
import tarfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
EXPECTED_HOST_KEY = "SHA256:ux7GbId7YEjk/WkvlX59qmX/6y08+xwgFSvYb/GgLLI"


def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, check=True, **kwargs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--known-hosts", required=True)
    parser.add_argument("--identity", default=str(Path.home() / ".ssh/cresol_vps"))
    parser.add_argument("--kubectl", required=True)
    parser.add_argument("--release", default=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    parser.add_argument("--frontend-only", action="store_true", help="Reuse the deployed API image; build and transfer only the frontend.")
    parser.add_argument("--prebuilt-frontend", action="store_true", help="Build Vite on the PC, then package the static output into the runtime image.")
    args = parser.parse_args()
    if args.prebuilt_frontend and not args.frontend_only:
        parser.error('--prebuilt-frontend requires --frontend-only')
    if not all(c.isalnum() or c in "-_" for c in args.release):
        raise SystemExit("Release name must contain only letters, digits, hyphens or underscores.")
    known_hosts = str(Path(args.known_hosts).resolve())
    fingerprint = run(["ssh-keygen", "-lf", known_hosts], capture_output=True, text=True).stdout
    if EXPECTED_HOST_KEY not in fingerprint:
        raise SystemExit("VPS host key does not match the independently verified identity.")
    ssh_options = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
                   "-o", f"UserKnownHostsFile={known_hosts}", "-o", "ConnectTimeout=15",
                   "-o", "KexAlgorithms=curve25519-sha256", "-o", "HostKeyAlgorithms=ssh-ed25519",
                   "-o", "IdentitiesOnly=yes", "-i", args.identity]
    target = "root@45.9.191.177"

    def remote(script, capture=False):
        encoded = base64.b64encode(("set -euo pipefail\n" + script).encode()).decode()
        return run(["ssh", *ssh_options, target, f"printf %s {encoded} | base64 -d | bash"],
                   capture_output=capture, text=True)

    # No cluster bootstrap, namespace, quota, priority or Cresol changes are shipped.
    remote("kubectl get namespace demos; kubectl -n demos get resourcequota; test $(kubectl get nodes --no-headers | wc -l) -eq 1")
    stage = ROOT / ".local-deploy" / f"vps-release-{args.release}"
    stage.mkdir(parents=True, exist_ok=False)
    reused_api = None
    if args.frontend_only:
        reused_api = remote("kubectl -n demos get deployment portfolio-api -o jsonpath='{.spec.template.spec.containers[0].image}'", capture=True).stdout.strip()
        if not reused_api.startswith('benny-portfolio-api:'):
            raise SystemExit('Frontend-only deployment requires an existing versioned portfolio API image.')
    builds = [("web", "deploy/Dockerfile.frontend")] if args.frontend_only else [("api", "deploy/Dockerfile.api"), ("web", "deploy/Dockerfile.frontend")]
    for name, dockerfile in builds:
        if name == 'web' and args.prebuilt_frontend:
            run(['node','node_modules/vite/bin/vite.js','build'])
            context = stage / 'frontend-context'
            shutil.copytree(ROOT / 'dist', context / 'html')
            shutil.copyfile(ROOT / 'deploy/nginx.conf', context / 'nginx.conf')
            shutil.copyfile(ROOT / 'deploy/Dockerfile.frontend-static', context / 'Dockerfile')
            run(['docker','build','-t',f'benny-portfolio-web:{args.release}',str(context)])
        else:
            run(["docker", "build", "-f", dockerfile, "-t", f"benny-portfolio-{name}:{args.release}", "."])
    manifest = run([args.kubectl, "kustomize", "deploy/kubernetes/base"], capture_output=True, text=True).stdout
    for name in ["api", "web"]:
        image = reused_api if name == 'api' and reused_api else f"benny-portfolio-{name}:{args.release}"
        manifest = manifest.replace(f"benny-portfolio-{name}:local", image)
    pg = json.loads(run(["docker", "image", "inspect", "postgres:15-bookworm"], capture_output=True, text=True).stdout)[0]
    pg_digest = next(d for d in pg["RepoDigests"] if d.startswith("postgres@sha256:"))
    manifest = manifest.replace("postgres:15-bookworm", pg_digest)
    (stage / "application.yaml").write_text(manifest, encoding="utf-8")

    files = run(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], capture_output=True).stdout.decode().split("\0")
    with tarfile.open(stage / "source.tar.gz", "w:gz") as archive:
        for name in sorted(set(filter(None, files))):
            path = Path(name)
            if path.is_absolute() or ".." in path.parts or any(p in {".git", ".local-deploy", "node_modules", "dist"} for p in path.parts):
                raise SystemExit(f"Unsafe source path: {name}")
            if path.name.startswith(".env") and path.name not in {".env.example", ".env.production.example"}:
                raise SystemExit("Refusing to package a private environment file.")
            if (ROOT / path).is_file():
                archive.add(ROOT / path, arcname=name, recursive=False)

    images = [f"benny-portfolio-{name}:{args.release}" for name, _ in builds]
    with (stage / "images.tar.gz").open("wb") as output:
        process = subprocess.Popen(["docker", "save", *images], stdout=subprocess.PIPE)
        try:
            with gzip.GzipFile(fileobj=output, mode="wb", compresslevel=1) as zipped:
                shutil.copyfileobj(process.stdout, zipped, length=1024 * 1024)
        finally:
            process.stdout.close()
        if process.wait() != 0:
            raise SystemExit("Docker image export failed.")
    evidence = {"release": args.release, "images": {}, "postgres": pg_digest}
    if reused_api:
        evidence['reused_api'] = reused_api
    if args.prebuilt_frontend:
        evidence['frontend_build'] = 'Vite built on PC, packaged using the same non-root Nginx runtime.'
    for image in images:
        evidence["images"][image] = json.loads(run(["docker", "image", "inspect", image], capture_output=True, text=True).stdout)[0]["Id"]
    (stage / "release.json").write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    names = ["application.yaml", "source.tar.gz", "images.tar.gz", "release.json"]
    checksums = ''
    for name in names:
        with (stage / name).open('rb') as source:
            checksums += f"{hashlib.file_digest(source, 'sha256').hexdigest()}  {name}\n"
    (stage / "SHA256SUMS").write_text(checksums, encoding="utf-8")
    destination = f"/opt/benny-portfolio/releases/{args.release}"
    remote(f"install -d -m 700 {shlex.quote(destination)}")
    for name in [*names, "SHA256SUMS"]:
        print(f"Uploading {name} ({(stage / name).stat().st_size / 1024**2:.1f} MiB)", flush=True)
        run(["scp", *ssh_options, str(stage / name), f"{target}:{destination}/{name}"])
    remote(f"cd {shlex.quote(destination)}; sha256sum -c SHA256SUMS; mkdir source; tar -xzf source.tar.gz -C source; k3s ctr images import images.tar.gz")
    # Credentials are generated on the server and never appear in command arguments or logs.
    remote(f"bash {shlex.quote(destination)}/source/deploy/vps-release.sh {shlex.quote(destination)}")
    print(f"Deployed {args.release} in demos. Public DNS/TLS configuration is a separate step.", flush=True)


if __name__ == "__main__":
    main()
