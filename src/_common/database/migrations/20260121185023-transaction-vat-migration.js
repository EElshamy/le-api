'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Transactions', 'vat', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: 2
    });

    await queryInterface.addColumn('Transactions', 'gatewayVat', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: 14
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Transactions', 'vat');
    await queryInterface.removeColumn('Transactions', 'gatewayVat');
  }
};
