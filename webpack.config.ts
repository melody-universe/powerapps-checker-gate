import { BannerPlugin, Configuration } from "webpack";

const config: Configuration = {
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new BannerPlugin({
      banner: "#!/usr/bin/env node",
      raw: true,
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
  target: "node",
};

export default config;
