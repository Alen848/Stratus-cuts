{
  description = "Peluqueria SaaS - [template#peluqueria]";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    devenv.url = "github:cachix/devenv";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ flake-parts, ... }:
    flake-parts.lib.mkPkgsFlip {
      imports = [ inputs.devenv.flakeModule ];
      systems = [ "x86_64-linux" ];

      perSystem = { config, self', inputs', pkgs, system, ... }: {
        # Esta es la conexión que hace que devenv vea tus módulos
        devenv.shells.default = {
          imports = [ ./devenv.nix ];
        };
      };
    };
}
