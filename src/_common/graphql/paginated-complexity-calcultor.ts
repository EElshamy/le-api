import { ComplexityEstimatorArgs } from 'graphql-query-complexity';

/**
 * calculates complexity for paginated lists: if the complexity for a field is not specified it defaults to 1.</br>
 *
 * If the data is not a list, the pagination is not specified or if it's less than or equal the default pagination = 15 then it's treated as a single item.
 * @returns complexity for lists larger than 15 multiplied by (requested items/15).
 */
export const paginatedComplexityEstimator = () => {
  return (options: ComplexityEstimatorArgs) => {
    const finalComplexity: number =
      options.childComplexity + ((options.field.extensions?.complexity as number) || 1);
    const pagination: number = options.args.paginate?.limit || 1;

    return pagination > 15 ? finalComplexity * (pagination / 15) : finalComplexity;
  };
};
