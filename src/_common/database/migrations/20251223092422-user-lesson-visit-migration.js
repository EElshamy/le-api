'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'UserLessonVisits',
      'UserLessonVisits_courseId_fkey'
    );

    await queryInterface.addConstraint('UserLessonVisits', {
      fields: ['courseId'],
      type: 'foreign key',
      name: 'UserLessonVisits_courseId_fkey',
      references: {
        table: 'Courses',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'UserLessonVisits',
      'UserLessonVisits_courseId_fkey'
    );

    await queryInterface.addConstraint('UserLessonVisits', {
      fields: ['courseId'],
      type: 'foreign key',
      name: 'UserLessonVisits_courseId_fkey',
      references: {
        table: 'Courses',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  }
};
