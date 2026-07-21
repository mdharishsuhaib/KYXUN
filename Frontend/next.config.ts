import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {};
export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
