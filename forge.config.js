module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: "Inferno214221, Mando369 & Ashuneko",
        description: "An editor for the MarkUp language MarkDown.",
        name: "MarkRight",
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        name: "MarkRight",
        description: "An editor for the MarkUp language MarkDown.",
        license: "GNU General Public License v3.0",
        categories: ["Utility"],
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        name: "MarkRight",
        description: "An editor for the MarkUp language MarkDown.",
        license: "GNU General Public License v3.0",
        categories: ["Utility"],
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
