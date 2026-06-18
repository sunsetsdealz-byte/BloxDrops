export const TID = {
  // Header / nav
  navLogo: "nav-logo",
  navStudio: "nav-studio",
  navFeed: "nav-feed",
  navBattle: "nav-battle",
  navChallenges: "nav-challenges",
  navPricing: "nav-pricing",
  navProfile: "nav-profile",
  navLogin: "nav-login",
  navRegister: "nav-register",
  navLogout: "nav-logout",
  navMobileToggle: "nav-mobile-toggle",
  navCredits: "nav-credits",

  // Landing
  heroCtaPrimary: "hero-cta-primary",
  heroCtaSecondary: "hero-cta-secondary",

  // Auth
  loginEmail: "login-email",
  loginPassword: "login-password",
  loginSubmit: "login-submit",
  loginError: "login-error",
  loginRemember: "login-remember",
  registerEmail: "register-email",
  registerPassword: "register-password",
  registerName: "register-name",
  registerSubmit: "register-submit",
  registerError: "register-error",

  // Studio
  studioPrompt: "studio-prompt",
  studioAttachment: "studio-attachment",
  studioStyle: "studio-style",
  studioEnhance: "studio-enhance",
  studioGenerate: "studio-generate",
  studioImageInput: "studio-image-input",
  studioImageGenerate: "studio-image-generate",
  studioModeText: "studio-mode-text",
  studioModeImage: "studio-mode-image",
  studioStatus: "studio-status",

  // Feed
  feedItem: (id) => `feed-item-${id}`,
  feedLike: (id) => `feed-like-${id}`,
  feedRemix: (id) => `feed-remix-${id}`,
  feedSortRecent: "feed-sort-recent",
  feedSortPopular: "feed-sort-popular",
  feedSortTrending: "feed-sort-trending",

  // Battle
  battleA: "battle-a",
  battleB: "battle-b",
  battleNext: "battle-next",

  // Pricing
  pricingPlanCreator: "pricing-plan-creator",
  pricingPlanPro: "pricing-plan-pro",
  pricingCheckout: (plan) => `pricing-checkout-${plan}`,
};
