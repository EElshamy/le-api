'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 1) add column
    await queryInterface.addColumn('Diplomas', 'diplomaType', {
      type: Sequelize.ENUM('PATH', 'SUBSCRIPTION'),
      allowNull: false,
      defaultValue: 'PATH'
    });

    // 2️) backfill old data
    await queryInterface.sequelize.query(`
      UPDATE "Diplomas"
      SET "diplomaType" = 'SUBSCRIPTION'
      WHERE "accessDurationPerMonths" IS NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('Diplomas', 'diplomaType');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Diplomas_diplomaType";'
    );
  }
};
