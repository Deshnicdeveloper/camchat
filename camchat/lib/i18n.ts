/**
 * CamChat Internationalization (i18n)
 * Supports English and French (Cameroon's official languages)
 */

import { I18n } from 'i18n-js';

const translations = {
  en: {
    // Tab Navigation
    tabs: {
      chats: 'Chats',
      status: 'Status',
      calls: 'Calls',
      settings: 'Settings',
    },

    // Common
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      success: 'Success',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      done: 'Done',
      next: 'Next',
      back: 'Back',
      skip: 'Skip',
      search: 'Search',
      delete: 'Delete',
      edit: 'Edit',
      ok: 'OK',
    },

    // Onboarding
    onboarding: {
      slide1: {
        title: 'Chat Like You\'re Home',
        subtitle: 'Send messages, voice notes, and media to friends and family across Cameroon and the world.',
      },
      slide2: {
        title: 'Share Your Moments',
        subtitle: 'Post photos, videos, and text statuses that last 24 hours. See what your people are up to.',
      },
      slide3: {
        title: 'Face to Face, Anywhere',
        subtitle: 'Crystal-clear voice and video calls, even on mobile data. Stay close no matter the distance.',
      },
      getStarted: 'Get Started',
    },

    // Auth
    auth: {
      phoneTitle: 'Enter your phone number',
      phoneSubtitle: 'We\'ll send you a verification code',
      continue: 'Continue',
      otpTitle: 'Enter verification code',
      otpSubtitle: 'We sent a code to',
      resendCode: 'Resend Code',
      resendIn: 'Resend in',
      profileTitle: 'Set up your profile',
      profileSubtitle: 'Add your name and photo',
      displayName: 'Your name',
      about: 'About',
      defaultAbout: 'Hey, I\'m on CamChat',
      // Error messages
      sendOtpError: 'Failed to send verification code. Please try again.',
      invalidCode: 'Invalid verification code. Please try again.',
      noPhoneNumber: 'Phone number not found. Please go back and enter your number.',
      codeSent: 'Verification code sent successfully.',
      photoPermissionRequired: 'Permission to access photos is required.',
      profileSetupError: 'Failed to create profile. Please try again.',
    },

    // Chats
    chats: {
      title: 'CamChat',
      newChat: 'New Chat',
      noChats: 'No chats yet. Tap to start a conversation.',
      typeMessage: 'Type a message',
      holdToRecord: 'Hold to record',
      photo: 'Photo',
      video: 'Video',
      voiceNote: 'Voice note',
      document: 'Document',
      online: 'Online',
      lastSeen: 'Last seen',
      typing: 'typing...',
      createError: 'Failed to start chat. Please try again.',
      archive: 'Archive',
      mute: 'Mute',
    },

    // Status
    status: {
      title: 'Status',
      myStatus: 'My Status',
      addStatus: 'Add Status',
      noStatus: 'None of your contacts have posted a status today.',
      recentUpdates: 'Recent Updates',
      mutedUpdates: 'Muted Updates',
      replyTo: 'Reply to',
    },

    // Calls
    calls: {
      title: 'Calls',
      noCalls: 'Your call log is empty. Time to catch up!',
      voiceCall: 'Voice Call',
      videoCall: 'Video Call',
      incoming: 'Incoming',
      outgoing: 'Outgoing',
      missed: 'Missed',
      callBack: 'Call Back',
    },

    // Settings
    settings: {
      title: 'Settings',
      account: 'Account',
      privacy: 'Privacy',
      security: 'Security',
      changeNumber: 'Change Number',
      chatsSettings: 'Chats',
      chatBackup: 'Chat Backup',
      chatWallpaper: 'Chat Wallpaper',
      fontSize: 'Font Size',
      notifications: 'Notifications',
      messageNotifications: 'Message Notifications',
      groupNotifications: 'Group Notifications',
      callRingtone: 'Call Ringtone',
      storage: 'Storage',
      dataUsage: 'Data Usage',
      autoDownload: 'Auto-Download Settings',
      language: 'Language',
      help: 'Help',
      faq: 'FAQ',
      contactSupport: 'Contact Support',
      reportBug: 'Report a Bug',
      logout: 'Log Out',
      editProfile: 'Edit Profile',
    },

    // Groups
    groups: {
      newGroup: 'New Group',
      addParticipants: 'Add Participants',
      groupInfo: 'Group Info',
      groupName: 'Group Name',
      groupDescription: 'Group Description',
      createGroup: 'Create Group',
      participants: 'participants',
      leaveGroup: 'Leave Group',
      admin: 'Admin',
    },

    // Contacts
    contacts: {
      onCamChat: 'Contacts on CamChat',
      syncContacts: 'Sync your contacts',
      syncDescription: 'Find friends who are already using CamChat by syncing your contacts.',
      allowAccess: 'Allow Access',
      permissionRequired: 'Permission to access contacts is required.',
      noContacts: 'No contacts found',
      noResults: 'No results found',
      tryDifferentSearch: 'Try a different search term',
      inviteFriends: 'Invite friends to join CamChat',
      refresh: 'Refresh',
    },

    // Messages
    messages: {
      noMessages: 'No messages yet',
      startConversation: 'Send a message to start the conversation',
      reply: 'Reply',
      star: 'Star',
      unstar: 'Unstar',
      copy: 'Copy',
      copied: 'Message copied',
      deleteMessage: 'Delete Message',
      deleteConfirm: 'Are you sure you want to delete this message?',
    },

    // Attachments
    attachments: {
      title: 'Share',
      camera: 'Camera',
      gallery: 'Gallery',
      document: 'Document',
      location: 'Location',
    },

    // Images
    images: {
      permissionRequired: 'Permission to save images is required.',
      savedToGallery: 'Image saved to gallery',
      downloadFailed: 'Failed to download image',
    },

    // Time
    time: {
      today: 'Today',
      yesterday: 'Yesterday',
      justNow: 'Just now',
      minutesAgo: 'min ago',
      hoursAgo: 'h ago',
    },
  },

  fr: {
    // Tab Navigation
    tabs: {
      chats: 'Discuter',
      status: 'Statuts',
      calls: 'Appels',
      settings: 'Paramètres',
    },

    // Common
    common: {
      loading: 'Chargement...',
      error: 'Une erreur s\'est produite',
      success: 'Succès',
      retry: 'Réessayer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      done: 'Terminé',
      next: 'Suivant',
      back: 'Retour',
      skip: 'Passer',
      search: 'Rechercher',
      delete: 'Supprimer',
      edit: 'Modifier',
      ok: 'OK',
    },

    // Onboarding
    onboarding: {
      slide1: {
        title: 'Discutez comme à la maison',
        subtitle: 'Envoyez des messages, des notes vocales et des médias à vos amis et à votre famille au Cameroun et dans le monde.',
      },
      slide2: {
        title: 'Partagez vos moments',
        subtitle: 'Publiez des photos, des vidéos et des statuts texte qui durent 24 heures. Voyez ce que font vos proches.',
      },
      slide3: {
        title: 'Face à face, partout',
        subtitle: 'Appels vocaux et vidéo cristallins, même avec les données mobiles. Restez proches malgré la distance.',
      },
      getStarted: 'Commencer',
    },

    // Auth
    auth: {
      phoneTitle: 'Entrez votre numéro de téléphone',
      phoneSubtitle: 'Nous vous enverrons un code de vérification',
      continue: 'Continuer',
      otpTitle: 'Entrez le code de vérification',
      otpSubtitle: 'Nous avons envoyé un code au',
      resendCode: 'Renvoyer le code',
      resendIn: 'Renvoyer dans',
      profileTitle: 'Configurez votre profil',
      profileSubtitle: 'Ajoutez votre nom et photo',
      displayName: 'Votre nom',
      about: 'À propos',
      defaultAbout: 'Salut, je suis sur CamChat',
      // Error messages
      sendOtpError: 'Échec de l\'envoi du code. Veuillez réessayer.',
      invalidCode: 'Code de vérification invalide. Veuillez réessayer.',
      noPhoneNumber: 'Numéro de téléphone introuvable. Veuillez revenir en arrière.',
      codeSent: 'Code de vérification envoyé avec succès.',
      photoPermissionRequired: 'Permission d\'accès aux photos requise.',
      profileSetupError: 'Échec de la création du profil. Veuillez réessayer.',
    },

    // Chats
    chats: {
      title: 'CamChat',
      newChat: 'Nouvelle discussion',
      noChats: 'Pas encore de discussions. Appuyez pour commencer une conversation.',
      typeMessage: 'Envoyer un message',
      holdToRecord: 'Appuyer pour enregistrer',
      photo: 'Photo',
      video: 'Vidéo',
      voiceNote: 'Note vocale',
      document: 'Document',
      online: 'En ligne',
      lastSeen: 'Vu',
      typing: 'écrit...',
      createError: 'Échec du démarrage de la discussion. Veuillez réessayer.',
      archive: 'Archiver',
      mute: 'Mettre en sourdine',
    },

    // Status
    status: {
      title: 'Statuts',
      myStatus: 'Mon Statut',
      addStatus: 'Ajouter un statut',
      noStatus: 'Aucun de vos contacts n\'a publié de statut aujourd\'hui.',
      recentUpdates: 'Mises à jour récentes',
      mutedUpdates: 'Mises à jour en sourdine',
      replyTo: 'Répondre à',
    },

    // Calls
    calls: {
      title: 'Appels',
      noCalls: 'Votre journal d\'appels est vide. Il est temps de rattraper le temps perdu!',
      voiceCall: 'Appel vocal',
      videoCall: 'Appel vidéo',
      incoming: 'Entrant',
      outgoing: 'Sortant',
      missed: 'Manqué',
      callBack: 'Rappeler',
    },

    // Settings
    settings: {
      title: 'Paramètres',
      account: 'Compte',
      privacy: 'Confidentialité',
      security: 'Sécurité',
      changeNumber: 'Changer de numéro',
      chatsSettings: 'Discussions',
      chatBackup: 'Sauvegarde des discussions',
      chatWallpaper: 'Fond d\'écran des discussions',
      fontSize: 'Taille de police',
      notifications: 'Notifications',
      messageNotifications: 'Notifications de messages',
      groupNotifications: 'Notifications de groupe',
      callRingtone: 'Sonnerie d\'appel',
      storage: 'Stockage',
      dataUsage: 'Utilisation des données',
      autoDownload: 'Téléchargement automatique',
      language: 'Langue',
      help: 'Aide',
      faq: 'FAQ',
      contactSupport: 'Contacter le support',
      reportBug: 'Signaler un bug',
      logout: 'Déconnexion',
      editProfile: 'Modifier le profil',
    },

    // Groups
    groups: {
      newGroup: 'Nouveau groupe',
      addParticipants: 'Ajouter des participants',
      groupInfo: 'Info du groupe',
      groupName: 'Nom du groupe',
      groupDescription: 'Description du groupe',
      createGroup: 'Créer le groupe',
      participants: 'participants',
      leaveGroup: 'Quitter le groupe',
      admin: 'Admin',
    },

    // Contacts
    contacts: {
      onCamChat: 'Contacts sur CamChat',
      syncContacts: 'Synchroniser vos contacts',
      syncDescription: 'Trouvez des amis qui utilisent déjà CamChat en synchronisant vos contacts.',
      allowAccess: 'Autoriser l\'accès',
      permissionRequired: 'Permission d\'accès aux contacts requise.',
      noContacts: 'Aucun contact trouvé',
      noResults: 'Aucun résultat trouvé',
      tryDifferentSearch: 'Essayez un autre terme de recherche',
      inviteFriends: 'Invitez des amis à rejoindre CamChat',
      refresh: 'Actualiser',
    },

    // Messages
    messages: {
      noMessages: 'Pas encore de messages',
      startConversation: 'Envoyez un message pour commencer la conversation',
      reply: 'Répondre',
      star: 'Favoris',
      unstar: 'Retirer des favoris',
      copy: 'Copier',
      copied: 'Message copié',
      deleteMessage: 'Supprimer le message',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce message ?',
    },

    // Attachments
    attachments: {
      title: 'Partager',
      camera: 'Caméra',
      gallery: 'Galerie',
      document: 'Document',
      location: 'Position',
    },

    // Images
    images: {
      permissionRequired: 'Permission de sauvegarder les images requise.',
      savedToGallery: 'Image enregistrée dans la galerie',
      downloadFailed: 'Échec du téléchargement de l\'image',
    },

    // Time
    time: {
      today: 'Aujourd\'hui',
      yesterday: 'Hier',
      justNow: 'À l\'instant',
      minutesAgo: 'min',
      hoursAgo: 'h',
    },
  },
};

const i18n = new I18n(translations);

// Set default locale
i18n.defaultLocale = 'en';
i18n.locale = 'en';

// Enable fallback to default locale
i18n.enableFallback = true;

export const setLocale = (locale: 'en' | 'fr') => {
  i18n.locale = locale;
};

export const getLocale = (): 'en' | 'fr' => {
  return i18n.locale as 'en' | 'fr';
};

export const t = (key: string, options?: Record<string, string | number>): string => {
  return i18n.t(key, options);
};

export default i18n;
