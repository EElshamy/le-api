import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Course } from '../models/course.model';
import { Inject } from '@nestjs/common';
import { Repositories } from '@src/_common/database/database-repository.enum';
import { Diploma } from '@src/diploma/models/diploma.model';
import { IRepository } from '@src/_common/database/repository.interface';
import { DiplomaCourses } from '@src/diploma/models/diploma-course.model';
import { CartItem } from '@src/cart/models/cart-item.model';
import { Cart } from '@src/cart/models/cart.model';

@Processor('PricingCalcs')
export class PricingCalcsProcessor {
  constructor(
    @Inject(Repositories.DiplomaCoursesRepository)
    private readonly diplomaCoursesRepo: IRepository<DiplomaCourses>,
    @Inject(Repositories.CartItemsRepository)
    private readonly cartItemsRepo: IRepository<CartItem>,
    @Inject(Repositories.CartsRepository)
    private readonly cartsRepo: IRepository<Cart>
  ) {}
  @Process('ApplyTheImpactOfCoursePriceChange')
  async handleCoursePriceChangeImpactOndDiplomas(job: Job) {
    await this.applyTheImpactOfPriceChangeOnDiplomas(
      job.data.changedCourse,
      job.data.changedPrice
    );
  }

  async applyTheImpactOfPriceChangeOnDiplomas(
    changedCourse: Course,
    changedPrice: number
  ) {
    // console.log('💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛');
    // console.log(changedPrice);
    // console.log('---------------------------------');

    // get all diplomas where this course is part of
    const diplomas = (
      await this.diplomaCoursesRepo.findAll(
        { courseId: changedCourse.id, keptForOldAssignments: false },
        [{ model: Diploma, required: true }]
      )
    ).map(dc => dc.diploma);
    console.log(`this course is part of ${diplomas.length} diplomas`);

    //>> for each diploma
    try {
      diplomas.forEach(async d => {
        // O(n^2)
        //* get recalculated price
        const diplomaCourses = (
          await this.diplomaCoursesRepo.findAll(
            { diplomaId: d.id, keptForOldAssignments: false },
            [{ model: Course }]
          )
        ).map(dc => dc.course);

        const recalculatedPriceOfDiploma = // O(n)
          await this.recalculateDiplomaOriginalPrice(
            diplomaCourses,
            changedCourse.id,
            changedPrice
          );
        // console.log('recalculatedPriceOfDiploma', recalculatedPriceOfDiploma);
        // console.log('---------------------------------');

        //* update each course (underDiplomaPrice) based on the new waights .. diploma price wouldn't change
        diplomaCourses.forEach(async course => {
          const price =
              course.id === changedCourse.id ?
                changedPrice / 100
              : course.priceAfterDiscount / 100,
            newWeightOfCourseInDiploma = price / recalculatedPriceOfDiploma;

          // console.log('newWeightOfCourseInDiploma', newWeightOfCourseInDiploma);
          // console.log('---------------------------------');

          // console.log(
          //   'priceOfCourseUnderDiploma',
          //   Math.trunc(
          //     newWeightOfCourseInDiploma *
          //       (d.priceAfterDiscount ?? d.originalPrice)
          //   )
          // );
          // console.log('---------------------------------');

          await this.diplomaCoursesRepo.updateOne(
            { diplomaId: d.id, courseId: course.id },
            {
              priceOfCourseUnderDiploma: Math.trunc(
                newWeightOfCourseInDiploma *
                  (d.priceAfterDiscount ?? d.originalPrice)
              )
            }
          );
        });
      });
      // console.log('💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛💛');
    } catch (error) {
      console.log('errorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', error);
    }
  }
  async recalculateDiplomaOriginalPrice(
    diplomaCourses: Course[],
    changedProgramId: string,
    changedPrice: number
  ) {
    return diplomaCourses.reduce((acc, course) => {
      acc +=
        course.id === changedProgramId ?
          changedPrice / 100
        : course.priceAfterDiscount / 100;
      return acc;
    }, 0);
  }
  /* ****************************************************************************/
  @Process('ApplyTheImpactOfProgramPriceChangeOnCarts')
  async handleProgramPriceChangeImpactOndCarts(job: Job) {
    console.log(
      'debugging_______ here we have a new job in ApplyTheImpactOfProgramPriceChangeOnCarts ______'
    );
    await this.ApplyTheImpactOfProgramPriceChangeOnCarts(
      job.data.progamId,
      job.data.oldPrice,
      job.data.newPrice
    );
  }

  async ApplyTheImpactOfProgramPriceChangeOnCarts(
    progamId: string,
    oldPrice: number,
    newPrice: number
  ) {
    // get all ids of carts where this program is in one of its cartItems
    const cartIds = (
      await this.cartItemsRepo.findAll(
        {
          learningProgramId: progamId
        },
        [],
        undefined,
        ['cartId']
      )
    ).map(ci => ci.cartId);
    for (const cartId of cartIds) {
      const cart = await this.cartsRepo.findOne({ id: cartId });
      const newTotalPrice = cart.totalPrice - oldPrice + newPrice;
      console.log(
        'cart.totalPrice, oldPrice, newPrice, newTotalPrice',
        cart.totalPrice,
        oldPrice,
        newPrice,
        newTotalPrice
      );
      await this.cartsRepo.updateOne(
        {
          id: cartId
        },
        {
          totalPrice: newTotalPrice
        }
      );
    }
  }
  @Process('ApplyTheImpactOfDiplomaPriceChangeOnCarts')
  async handleDiplomaPriceChangeImpactOndCarts(job: Job) {
    console.log(
      'debugging_______ here we have a new job in ApplyTheImpactOfDiplomaPriceChangeOnCarts ______'
    );
    await this.ApplyTheImpactOfDiplomaPriceChangeOnCarts(
      job.data.diplomaId,
      job.data.oldPrice,
      job.data.newPrice
    );
  }
  // todo . there are a lot of logs for debugging here.. delete it directly after testing
  async ApplyTheImpactOfDiplomaPriceChangeOnCarts(
    diplomaId: string,
    oldPrice: number,
    newPrice: number
  ) {
    console.log(
      'debugging_______ here we have a new job in ApplyTheImpactOfDiplomaPriceChangeOnCarts ______'
    );
    console.log(
      'diplomaId',
      diplomaId,
      'oldPrice',
      oldPrice,
      'newPrice',
      newPrice
    );
    // get all cartItems with this diploma
    const cartItems = await this.cartItemsRepo.findAll(
      {
        learningProgramId: diplomaId
      },
      [],
      undefined,
      ['id', 'cartId', 'adjustedPrice']
    );
    console.log(
      'cartIds',
      cartItems.map(ci => ci.cartId)
    );

    if (cartItems.length === 0) return;
    for (const cartItem of cartItems) {
      console.log(
        'debugging_______ cartItem adjustedPrice ',
        cartItem.adjustedPrice,
        ' ______'
      );
      if (cartItem.adjustedPrice) {
        const newAdjustedPrice = (newPrice * cartItem.adjustedPrice) / oldPrice;

        console.log('newAdjustedPrice', cartItem.id, newAdjustedPrice);

        await this.cartItemsRepo
          .updateAll(
            { id: cartItem.id },
            {
              adjustedPrice: newAdjustedPrice
            }
          )
          .then(() => {
            console.log(
              'cartItem with( id :',
              cartItem.id,
              ').adjustedPrice updated to be ',
              newAdjustedPrice
            );
          });

        const cart = await this.cartsRepo.findOne(
          { id: cartItem.cartId },
          [],
          undefined,
          ['id', 'totalPrice']
        );
        const newTotalPrice =
          cart.totalPrice - cartItem.adjustedPrice + newAdjustedPrice;
        console.log('newTotalPrice', cartItem.id, newTotalPrice);

        await this.cartsRepo
          .updateAll(
            { id: cart.id },
            {
              totalPrice: newTotalPrice
            }
          )
          .then(() => {
            console.log(
              'cart with( id :',
              cart.id,
              ').totalPrice updated to be ',
              newTotalPrice
            );
          });
        console.log('debugging_____________');
      } else {
        const cart = await this.cartsRepo.findOne(
          { id: cartItem.cartId },
          [],
          undefined,
          ['id', 'totalPrice']
        );
        const newTotalPrice = cart.totalPrice - oldPrice + newPrice;
        await this.cartsRepo.updateOneFromExistingModel(cart, {
          totalPrice: newTotalPrice
        });
      }
    }

    return;
  }
}
