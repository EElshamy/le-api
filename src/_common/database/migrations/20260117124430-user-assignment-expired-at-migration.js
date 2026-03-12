'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'UsersAssignments',
      'accessExpiresAt',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'UsersAssignments',
      'accessExpiresAt'
    );
  }
};
