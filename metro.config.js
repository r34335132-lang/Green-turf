const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isNative = platform === "ios" || platform === "android";

  if (isNative && moduleName === "@supabase/supabase-js") {
    return context.resolveRequest(
      context,
      require.resolve("@supabase/supabase-js/dist/index.cjs"),
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
