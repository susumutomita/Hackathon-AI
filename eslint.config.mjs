import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "mcp-server/**",
      "coverage/**",
    ],
  },
];

export default config;
