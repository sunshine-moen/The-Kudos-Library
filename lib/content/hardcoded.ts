// Locked: not admin-editable; cross-tenant product voice; see 15_decision_log.md

export const PRODUCT_COPY = {
  hero: {
    tagline: "A library of moments your team made.",
    subline:
      "Give a kudos. It becomes a book on their shelf — a permanent record the whole team can read.",
  },

  marketing: {
    title: "The Kudos Library",
    tagline: "A library of moments your team made.",
    whatItIs:
      "Kudos are books. Each one lives on a shelf, waiting to be found by someone who wasn't even there. That's the point — recognition that outlasts the moment it was given.",
    whyItMatters: [
      "See the work your colleagues do, even when you weren't in the room.",
      "Managers get a weekly digest of what their team accomplished.",
      "The library is the team's memory. Quiet, honest, and always open.",
    ],
    cta: "Request your login link",
  },

  teachingMoments: {
    individual: (giverFirstName: string) =>
      `This is what ${giverFirstName} saw.`,
    team: (giverFirstName: string) =>
      `This is what ${giverFirstName} saw your team do. The library keeps things like this.`,
    payItForward:
      "When you notice something good, you can write it down too.",
  },

  emails: {
    subjects: {
      magicLink: "Your login link for The Kudos Library",
      magicLinkNewDevice: "Confirm your device — The Kudos Library",
      recipientNotify: (giverFirstName: string) =>
        `${giverFirstName} left something for you in the library`,
      managerDigest: "Your team's week in kudos",
      managerQuietWeek: "A quiet week — and an invitation",
      badgeMilestone: (badgeName: string) => `You earned: ${badgeName}`,
      overlookedRecipient: "Someone on your team could use some recognition",
      inactiveNudge: "The library is waiting for you",
      topGiverAnnouncement: "You gave the most kudos this week",
      anniversaryReminder: (memberName: string) =>
        `${memberName}'s work anniversary is coming up`,
      kudosWasReadDigest: "Your words made it to them",
      promptAnnouncement: "This week's library prompt",
      deletionConfirmation: "Your account deletion is scheduled",
      deletionCancelled: "Your account deletion has been cancelled",
    },
  },

  emptyStates: {
    library: "No books on the shelves yet. Be the first to leave one.",
    shelf: "No kudos on this shelf yet.",
    badges: "No badges yet. Give a kudos to start collecting.",
    newArrivals: "Nothing new this week — but the shelves are waiting.",
    leaderboard: "No entries yet for this period.",
  },

  toasts: {
    kudosSubmitted: "Your kudos is in the library.",
    kudosEdited: "Your kudos has been updated.",
    kudosDeleted: "Kudos removed from the library.",
    settingsSaved: "Settings saved.",
    memberAdded: "Member added to the roster.",
    memberUpdated: "Member updated.",
    memberDeactivated: "Member deactivated.",
    deletionRequested: "Account deletion scheduled. You have 30 days to cancel.",
    deletionCancelled: "Account deletion cancelled. You're back.",
    preferencesSaved: "Preferences saved.",
  },

  modals: {
    deleteKudos: {
      title: "Remove this kudos?",
      body: "This kudos will be hidden from the library. The text is preserved in admin records.",
      confirm: "Remove kudos",
      cancel: "Keep it",
    },
    deleteAccount: {
      title: "Delete your account?",
      body: "Your kudos text will be kept for team history, but your name will be removed. Your badges and reading history will be deleted. You have 30 days to cancel.",
      confirm: "Schedule deletion",
      cancel: "Keep my account",
    },
  },

  onboarding: {
    tosPrompt:
      "By joining the library, you agree to use kudos genuinely and respectfully.",
    tosAccept: "I agree to the Terms of Service and Privacy Policy",
    tosDecline: "Not now",
  },

  pickupIndicator: (count: number) => {
    if (count === 0) return "Your books are waiting to be found.";
    if (count === 1) return "1 book has been picked up.";
    return `${count} books have been picked up.`;
  },
} as const;
