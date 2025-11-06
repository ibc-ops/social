import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Video Chat',
      },
      Component: async () => {
        const component = await import('./pages/HomePage');
        return component;
      },
      permissions: [],
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: 'video-chat',
    });
  },

  async bootstrap(app: any) {
    // Bootstrap logic if needed
  },
};
