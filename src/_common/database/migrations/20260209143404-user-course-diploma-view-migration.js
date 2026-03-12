'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserCourseDiplomaViews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      courseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Courses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      diplomaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Diplomas',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Add unique constraint for combination of userId, courseId, diplomaId
    await queryInterface.addConstraint('UserCourseDiplomaViews', {
      fields: ['userId', 'courseId', 'diplomaId'],
      type: 'unique',
      name: 'uq_user_course_diploma_view'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserCourseDiplomaViews');
  }
};
