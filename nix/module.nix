self: { config, lib, pkgs, ... }:

let
  cfg = config.services.spells;
in {
  options.services.spells = {
    enable = lib.mkEnableOption "spells server";

    package = lib.mkOption {
      type = lib.types.package;
      default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
      description = "The spells package to use.";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 3000;
      description = "Port the app listens on.";
    };

    hostname = lib.mkOption {
      type = lib.types.str;
      default = "127.0.0.1";
      description = "Hostname/interface the app binds to. Use \"0.0.0.0\" to accept external traffic.";
    };

    openFirewall = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Whether to open `port` in the firewall.";
    };

    environmentFile = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
      description = ''
        Path to an EnvironmentFile (containing e.g. OPENROUTER_API_KEY=...,
        used for cover image generation) loaded by systemd before starting
        the service. Keeps secrets out of the Nix store.
      '';
    };
  };

  config = lib.mkIf cfg.enable {
    networking.firewall.allowedTCPPorts = lib.mkIf cfg.openFirewall [ cfg.port ];

    systemd.services.spells = {
      description = "spells server";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];

      environment = {
        NODE_ENV = "production";
      };

      serviceConfig = {
        ExecStart = "${cfg.package}/bin/spells --port ${toString cfg.port} --host ${cfg.hostname} --strictPort";
        EnvironmentFile = lib.mkIf (cfg.environmentFile != null) cfg.environmentFile;
        DynamicUser = true;
        PrivateTmp = true;
        ProtectSystem = "strict";
        NoNewPrivileges = true;
        Restart = "on-failure";
        RestartSec = "5s";
      };
    };
  };
}
