{ pkgs ? import <nixpkgs> {}, lib }:

let
  pnpmDeps = pkgs.fetchPnpmDeps {
    pname = "spells";
    version = "0.0.0";
    src = ../.;
    fetcherVersion = 3;
    hash = "";
  };
in

pkgs.stdenv.mkDerivation {
  pname = "spells";
  version = "0.0.0";
  src = ../.;

  nativeBuildInputs = [ pkgs.nodejs_24 pkgs.pnpm pkgs.pnpmConfigHook pkgs.makeWrapper ];

  inherit pnpmDeps;

  buildPhase = ''
    runHook preBuild
    pnpm build
    runHook postBuild
  '';

  # This app doesn't use a Nitro/node-server preset; its production server is
  # `vite preview`, which serves the built dist/client + dist/server bundle
  # and needs vite.config.ts + node_modules alongside the build output.
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/spells
    cp -r dist node_modules src public package.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json $out/lib/spells/

    mkdir -p $out/bin
    makeWrapper ${pkgs.nodejs_24}/bin/node $out/bin/spells \
      --add-flags "$out/lib/spells/node_modules/vite/bin/vite.js preview --configLoader runner" \
      --chdir "$out/lib/spells"
    runHook postInstall
  '';
}
