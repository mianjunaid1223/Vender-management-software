import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:9002',
        '*.app.github.dev',
        '*.gitpod.io',
        '*.codespaces.github.com'
      ],
    },
  },
  webpack: (config, { isServer }) => {
    // Fix for handlebars webpack compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
      };
    }
    
    // Ignore specific modules that cause issues
    config.externals = config.externals || [];
    config.externals.push({
      '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger',
      '@genkit-ai/firebase': 'commonjs @genkit-ai/firebase'
    });
    
    return config;
  },
};

export default nextConfig;
