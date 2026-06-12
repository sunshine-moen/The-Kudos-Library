// Locked: not admin-editable; cross-tenant product voice; see docs/content/12_content_plan.md §1
// Witnessing-framed verb cluster: noticing / noticed / saw / watched / add to the library (never "submit," "create," or "send")
// Editorial conventions: Canadian spellings, unspaced em-dashes, no serial commas, no exclamation marks except modal confirmation.

export const PRODUCT_COPY = {
  hero: {
    tagline: "A library a team builds together—one kudos at a time, growing into a history.",
    subline:
      "Give a kudos. It becomes a book on their shelf—a permanent record the whole team can read.",
  },

  marketing: {
    title: "The Kudos Library",
    tagline: "A library a team builds together—one kudos at a time, growing into a history.",
    whatItIs:
      "The Kudos Library is where team members recognize each other in a way that celebrates the small and big moments. With each kudos, the team builds a collective library that forms its history. It's built for teams that value recognition as part of their culture—and know that taking time to notice each other's efforts leads to stronger, more resilient workplaces.",
    howItWorks: [
      {
        step: "Notice.",
        body: "Someone on your team does something good—covers for a colleague, shares what they know, shows up when it matters. You see it.",
      },
      {
        step: "Add it to the library.",
        body: "Write a short kudos on /celebrate. Pick a value, a book design, even a GIF if you want. It takes a minute.",
      },
      {
        step: "It lands on their shelf.",
        body: "Your teammate gets an email. The kudos appears as a book on their shelf, where everyone can see it. Managers receive a weekly digest of what their team noticed.",
      },
    ],
    cta: "Sign in to the library",
  },

  teachingMoments: {
    individual: (giverFirstName: string) =>
      `This is what ${giverFirstName} saw. The library keeps things like this.`,
    team: (giverFirstName: string) =>
      `This is what ${giverFirstName} saw your team do. The library keeps things like this.`,
    payItForwardNoPrompt: "What did you notice this week? Add to the library →",
    payItForwardWithPrompt: (promptText: string) =>
      `This week we're noticing: ${promptText}. Add to the library →`,
    weeklyNoticing: (promptText: string) =>
      `This week we're noticing: ${promptText}`,
  },

  shelfNames: {
    newArrivals: "New Arrivals.",
  },

  emails: {
    subjects: {
      magicLink: "Your sign-in link for The Kudos Library",
      magicLinkNewDevice: "Confirm your device—The Kudos Library",
      recipientNotify: (giverFirstName: string) =>
        `${giverFirstName} left something for you in the library`,
      managerDigest: "Your team's week in kudos",
      managerQuietWeek: "A quiet week—and an invitation",
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
    library: "The library is brand new. Be the first to add a kudos.",
    libraryCta: "Add to the library",
    shelfOther: (firstName: string) => `${firstName}'s shelf is waiting for its first book.`,
    shelfOwn: "Your shelf is waiting for its first book.",
    shelfTeam: (teamName: string) => `${teamName}'s shelf is waiting for its first book.`,
    badges: "No badges yet. Add your first kudos to earn First Chapter.",
    badgesCta: "Add to the library",
    newArrivals: null,
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
    kudosSubmitted: {
      individual: (recipientFirstName: string) => `Thanks for celebrating ${recipientFirstName}!`,
      team: (teamShortName: string) => `Thanks for celebrating ${teamShortName}!`,
      ctaRecognizeAnother: "Recognize another teammate",
      ctaBackToLibrary: "Back to library",
    },
    deleteKudos: {
      title: "Remove this kudos?",
      body: "This kudos will be hidden from the library. The text is preserved in admin records.",
      confirm: "Remove kudos",
      cancel: "Keep it",
    },
    deleteAccount: {
      title: "Delete your account?",
      body: "Your account will enter a 30-day grace period. During that time, you can restore it from any email we send you.",
      itemsDeleted: [
        "Your shelf",
        "Kudos you've given",
        "Kudos you've received",
        "Your badges",
        "Your email settings",
      ],
      warning: "This cannot be undone.",
      instruction:
        "If you didn't mean to do this, close this window. Otherwise, click below to start the 30-day grace period.",
      confirm: "Yes, start the 30-day grace period",
      cancel: "Cancel",
    },
  },

  login: {
    initial: {
      heading: "Sign in to The Kudos Library",
      body: "Type your work email and we'll send you a sign-in link.",
      emailPlaceholder: "you@ag.ubc.ca",
      cta: "Send me a sign-in link",
    },
    postSubmit: {
      heading: "Check your email",
      body: (emailAddress: string) =>
        `We sent a sign-in link to ${emailAddress}. It works once and expires in 10 minutes.`,
      hint: "Don't see it? Wait a moment, then check your spam folder. If it still hasn't arrived, you can ask for a new link in five minutes.",
      ctaResend: "Ask for a new link",
    },
  },

  deviceConfirmation: {
    heading: "Confirm this device",
    subheading: "Welcome to The Kudos Library.",
    body: "This is the first time we've seen you sign in from this device. Click below to confirm it's you—then we'll remember this device for 90 days.",
    caveat:
      "If you didn't expect this, close this page. Whoever forwarded the email can't read your kudos without confirming.",
    cta: "Yes, this is me",
  },

  editWindow: {
    moreThanOneMinute: (minutesRemaining: number) =>
      `Edit window: ${minutesRemaining} minutes remaining`,
    exactlyOneMinute: "Edit window: 1 minute remaining",
    lessThanOneMinute: "Edit window: less than a minute remaining",
    tooltip:
      "You can edit the message, values, context or GIF until the timer runs out. The recipient won't see the kudos until then.",
  },

  restoreAccount: {
    heading: "Welcome back",
    body: "Your account is restored. Your shelf, your kudos and your badges are all where you left them.",
    cta: "Open the library",
  },

  formValidation: {
    recipientRequired: "Pick a person or team to celebrate.",
    selfKudosBlocked: "You can't write a kudos about yourself. Notice someone else?",
    messageRequired: "Add a message—even a sentence or two.",
    contextTooLong: "Context is 200 characters or fewer.",
    submitError: "Something went wrong. Try again in a moment.",
  },

  onboarding: {
    tosPrompt:
      "By joining the library, you agree to use kudos genuinely and respectfully.",
    tosAccept: "I agree to the Terms of Service and Privacy Policy",
    tosDecline: "Not now",
  },

  // Returns null when count === 0 — caller must hide the component entirely (no text renders).
  pickupIndicator: (count: number): string | null => {
    if (count === 0) return null;
    if (count === 1) return "Your books are being picked up—1 time this week.";
    return `Your books are being picked up—${count} times this week.`;
  },
} as const;
