'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Courses', 'Courses_enTitle_key');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Courses', {
      fields: ['enTitle'],
      type: 'unique',
      name: 'Courses_enTitle_key'
    });
  }
};
