// Maps a rating to a CSS class for consistent tier highlighter coloring.
export const getRatingClass = (rating) => {
  const key = `rating-${rating}`;
  const validRatings = [800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400];
  return validRatings.includes(rating) ? key : 'rating-default';
};
