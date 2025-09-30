/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'via.placeholder.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'ncuktfdjktkqvhdaxtkg.supabase.co',
          pathname: '/**',
        },
      ],
    },
  };
  
  module.exports = nextConfig;
  
  