'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Blogs', 'lang', {
      type: Sequelize.ENUM('EN', 'AR'),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Blogs', 'lang');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Blogs_lang";');
  },
};
