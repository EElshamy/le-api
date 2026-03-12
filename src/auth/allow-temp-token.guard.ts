export const AllowTemporaryToken = (target: any) => {
  return class NewClass extends target {
    allowTemporaryToken = true;
  };
};
