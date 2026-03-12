'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'UserLessonVisits',
      'UserLessonVisits_lessonId_fkey'
    );

    await queryInterface.addConstraint('UserLessonVisits', {
      fields: ['lessonId'],
      type: 'foreign key',
      name: 'UserLessonVisits_lessonId_fkey',
      references: {
        table: 'Lessons',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'UserLessonVisits',
      'UserLessonVisits_lessonId_fkey'
    );

    await queryInterface.addConstraint('UserLessonVisits', {
      fields: ['lessonId'],
      type: 'foreign key',
      name: 'UserLessonVisits_lessonId_fkey',
      references: {
        table: 'Lessons',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  }
};
