{pkgs}: {
  channel = "stable-23.11"; # "stable-23.11" or "unstable"
  packages = [
    pkgs.cacert
    pkgs.ssl-proxy
    pkgs.nodejs
    pkgs.yarn
    pkgs.nodePackages.pnpm
    pkgs.bun
  ];
  idx.extensions = [
  ];
  # runs when a workspace is first created with this `dev.nix` file
  # to run something each time the environment is rebuilt, use the `onStart` hook
  idx.workspace.onCreate = {
    npm-install = "npm install";
  };
  idx.previews = {
    enable = true;
    previews = [
      {
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
        env = {
          NODE_TLS_REJECT_UNAUTHORIZED = "0";
          API_URI = "https://api.stl1.co.kr";
          HOST = "0.0.0.0";
          KAKAO_KEY = "fe100722a808f82c00d5e1840c24dd7f";
        };
        manager = "web";
        id = "web";
      }
    ];
  };
}