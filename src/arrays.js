const crypto = require("crypto");

exports.shuffle = function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = crypto.randomInt(currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    console.log(`${array[currentIndex]} new index is ${randomIndex}`);
  }

  return array;
}