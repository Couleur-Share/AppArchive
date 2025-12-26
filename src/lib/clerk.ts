import { Clerk } from '@clerk/clerk-js';
import type { App } from 'vue';
import { ref } from 'vue';
import { zhCN } from '@clerk/localizations';
import logger from '../utils/logger';

declare global {
  interface ImportMetaEnv {
    readonly VITE_CLERK_PUBLISHABLE_KEY: string
  }
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// 创建全局状态
export const isSignedIn = ref(false);
export const user = ref<any>(null);

let clerk: Clerk | null = null;

export const initClerk = async (app: App) => {
  try {
    clerk = new Clerk(publishableKey);
    
    // 单独设置外观和本地化
    await clerk.load({
      appearance: {
        layout: {
          helpPageUrl: "https://clerk.dev/support",
          logoImageUrl: "", // 可以添加自己的 logo
          logoPlacement: "inside",
          privacyPageUrl: "https://clerk.dev/privacy",
          showOptionalFields: true,
          socialButtonsPlacement: "bottom",
          termsPageUrl: "https://clerk.dev/terms",
        },
        variables: {
          colorPrimary: '#3b82f6',
          colorText: '#111827',
          colorBackground: '#ffffff',
          colorDanger: '#ef4444',
          borderRadius: '0.75rem',
        },
        elements: {
          formButtonPrimary: {
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'none',
            backgroundColor: '#3b82f6',
          },
          card: {
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    });
    
    clerk.addListener(({ user: clerkUser }) => {
      isSignedIn.value = !!clerkUser;
      user.value = clerkUser;
    });

    app.config.globalProperties.$clerk = {
      openSignIn: async () => await clerk?.openSignIn({}) || Promise.resolve(),
      signOut: () => clerk?.signOut(),
      user: user,
      isSignedIn: isSignedIn
    };

    return clerk;
  } catch (error) {
    logger.error('Failed to initialize Clerk:', error);
    throw error;
  }
};

// 修改 openSignIn 方法
export const openSignIn = async () => {
  return clerk?.openSignIn({
    appearance: {
      layout: {
        logoPlacement: "inside",
        socialButtonsPlacement: "bottom",
        privacyPageUrl: '',  // 或者 'none'
        termsPageUrl: '',    // 或者 'none'
      },
      variables: {
        colorPrimary: '#3b82f6',
        colorText: '#111827',
        colorBackground: '#ffffff',
        colorDanger: '#ef4444',
        borderRadius: '0.75rem',
      },
      elements: {
        formButtonPrimary: {
          fontSize: '14px',
          fontWeight: '600',
          textTransform: 'none',
          backgroundColor: '#3b82f6',
        },
        card: {
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        headerTitle: {
          fontSize: '1.5rem',
          fontWeight: '600',
        },
        headerSubtitle: {
          fontSize: '0.875rem',
          color: '#6B7280',
        },
        socialButtonsBlockButton: {
          justifyContent: 'center',
          gap: '0.5rem',
        },
      },
    }
  });
};

export const signOut = () => clerk?.signOut();

// 类型声明保持不变
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $clerk: {
      openSignIn: () => Promise<void>;
      signOut: () => Promise<void> | undefined;
      user: typeof user;
      isSignedIn: typeof isSignedIn;
    }
  }
}