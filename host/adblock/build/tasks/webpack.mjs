/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import Dotenv from "dotenv-webpack";
import gulp from "gulp";
import merge2 from "merge2";
import webpackStream from "webpack-stream";
import webpackMerge from "webpack-merge";
import webpackMain from "webpack";
import named from "vinyl-named";

export default function webpack({
  webpackInfo,
  addonName,
  addonVersion,
  sourceMapType,
  skipTypeChecks,
}) {
  // merge2 will merge these streams keeping their existing order. This is
  // important, because if the order changes webpack can give results that are
  // functionally the same between runs, but not byte-for-byte identical.
  return merge2(
    ...webpackInfo.bundles.map((bundle) => gulp.src(bundle.src).pipe(named(() => bundle.dest))),
  ).pipe(
    webpackStream(
      {
        quiet: true,
        config: webpackMerge.merge(webpackInfo.baseConfig, {
          devtool: sourceMapType,
          output: {
            filename: "[name]",
          },
          resolve: {
            extensions: [".ts", ".js", ".json", ".wasm", ".jsx"],
            alias: webpackInfo.alias,
            symlinks: false,
          },
          module: {
            rules: [
              {
                test: /info.?/,
                loader: "wp-template-loader",
                options: {
                  data: { addonName, addonVersion },
                },
              },
              {
                test: /\.ts$/,
                use: [
                  {
                    loader: "ts-loader",
                    options: { transpileOnly: skipTypeChecks },
                  },
                ],
              },
              {
                test: /\.(js|jsx)$/,
                include: [/button\/react-components/, /node_modules\/@eyeo\/ext-ui-components/],
                use: {
                  loader: "babel-loader",
                  options: {
                    presets: [
                      "@babel/preset-env",
                      ["@babel/preset-react", { runtime: "automatic" }],
                    ],
                  },
                },
              },
            ],
          },
          plugins: [
            new Dotenv({
              prefix: "webpackDotenvPlugin.",
              defaults: true,
              silent: true,
              systemvars: true,
            }),
          ],
          externals: {
            perf_hooks: "self",
          },
        }),
      },
      webpackMain,
    ),
  );
}
