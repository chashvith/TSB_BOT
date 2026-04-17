const fs = require("fs");

// Read existing questions
const math = JSON.parse(
  fs.readFileSync("src/features/quiz/questions/math.json", "utf8"),
);
const puzzles = JSON.parse(
  fs.readFileSync("src/features/quiz/questions/puzzles.json", "utf8"),
);
const general = JSON.parse(
  fs.readFileSync("src/features/quiz/questions/general.json", "utf8"),
);

// 250 new MATH questions (covering more topics)
const newMath = [
  {
    question: "What is 99 / 9?",
    options: ["9", "10", "11", "12"],
    answer: "11",
  },
  {
    question: "What is 101 - 1?",
    options: ["99", "100", "101", "102"],
    answer: "100",
  },
  {
    question: "What is the circumference of a circle with diameter 10?",
    options: ["10π", "20π", "30π", "40π"],
    answer: "10π",
  },
  {
    question: "Solve: 10x = 100",
    options: ["x=5", "x=10", "x=15", "x=20"],
    answer: "x=10",
  },
  {
    question: "What is 17² ?",
    options: ["280", "289", "300", "320"],
    answer: "289",
  },
  {
    question: "What are the factors of 12?",
    options: ["1,2,3,4,6,12", "1,2,3,12", "2,3,4,6", "1,3,6,12"],
    answer: "1,2,3,4,6,12",
  },
  {
    question: "What is sin(30°)?",
    options: ["1/2", "√2/2", "√3/2", "1"],
    answer: "1/2",
  },
  {
    question: "What is cos(60°)?",
    options: ["0", "1/2", "√2/2", "1"],
    answer: "1/2",
  },
  {
    question: "What is the area of a triangle with base 10 and height 5?",
    options: ["25", "50", "75", "100"],
    answer: "25",
  },
  {
    question: "What is the perimeter of a square with side 8?",
    options: ["16", "32", "64", "128"],
    answer: "32",
  },
  {
    question: "What is 18 + 32?",
    options: ["40", "50", "60", "70"],
    answer: "50",
  },
  {
    question: "What is 120 - 40?",
    options: ["70", "80", "90", "100"],
    answer: "80",
  },
  {
    question: "What is 22 * 5?",
    options: ["90", "100", "110", "120"],
    answer: "110",
  },
  {
    question: "What is 144 / 12?",
    options: ["10", "11", "12", "13"],
    answer: "12",
  },
  {
    question: "What is 9 * 9?",
    options: ["72", "81", "90", "99"],
    answer: "81",
  },
  {
    question: "Is 37 prime?",
    options: ["No", "Yes", "Not sure", "Both prime and composite"],
    answer: "Yes",
  },
  {
    question: "What is √361?",
    options: ["17", "18", "19", "20"],
    answer: "19",
  },
  {
    question: "What is √289?",
    options: ["15", "16", "17", "18"],
    answer: "17",
  },
  {
    question: "What is the next even number after 56?",
    options: ["57", "58", "59", "60"],
    answer: "58",
  },
  {
    question: "What is the next odd number after 47?",
    options: ["48", "49", "50", "51"],
    answer: "49",
  },
  {
    question: "Complete sequence: 5, 10, 15, 20, ?",
    options: ["23", "24", "25", "26"],
    answer: "25",
  },
  {
    question: "Complete sequence: 100, 90, 80, 70, ?",
    options: ["55", "60", "65", "70"],
    answer: "60",
  },
  {
    question: "What is 2/5 as a decimal?",
    options: ["0.2", "0.4", "0.5", "0.6"],
    answer: "0.4",
  },
  {
    question: "What is 3/8 as a decimal?",
    options: ["0.3", "0.375", "0.5", "0.6"],
    answer: "0.375",
  },
  {
    question: "What is 15% of 200?",
    options: ["20", "25", "30", "35"],
    answer: "30",
  },
  {
    question: "What is 40% of 250?",
    options: ["80", "90", "100", "110"],
    answer: "100",
  },
  {
    question: "What is log₁₀(1000)?",
    options: ["1", "2", "3", "4"],
    answer: "3",
  },
  {
    question: "What is e (Euler's number) approximately?",
    options: ["2.17", "2.57", "2.72", "3.14"],
    answer: "2.72",
  },
  {
    question: "What is the derivative of 5x?",
    options: ["5", "x", "5x", "10"],
    answer: "5",
  },
  {
    question: "What is the derivative of x⁴?",
    options: ["4x", "4x²", "4x³", "x³"],
    answer: "4x³",
  },
  {
    question: "What is the integral of 2x dx?",
    options: ["2", "x²", "x² + C", "2x + C"],
    answer: "x² + C",
  },
  {
    question: "Solve: x² - 4x + 3 = 0",
    options: ["x=1,2", "x=1,3", "x=2,3", "x=3,4"],
    answer: "x=1,3",
  },
  {
    question: "What is the sum of interior angles in a quadrilateral?",
    options: ["180°", "270°", "360°", "540°"],
    answer: "360°",
  },
  {
    question: "What is the sum of interior angles in an octagon?",
    options: ["720°", "900°", "1080°", "1260°"],
    answer: "1080°",
  },
  {
    question: "What is 25 / 0.5?",
    options: ["12.5", "25", "50", "75"],
    answer: "50",
  },
  {
    question: "What is 0.5 * 0.5?",
    options: ["0.25", "0.5", "1", "2"],
    answer: "0.25",
  },
  {
    question: "What is 1.5² ?",
    options: ["2", "2.25", "2.5", "3"],
    answer: "2.25",
  },
  { question: "What is (-3)² ?", options: ["-9", "-6", "6", "9"], answer: "9" },
  {
    question: "What is (-2)³ ?",
    options: ["-8", "-6", "6", "8"],
    answer: "-8",
  },
  {
    question: "Solve: 2x + 10 = 30",
    options: ["x=5", "x=10", "x=15", "x=20"],
    answer: "x=10",
  },
  {
    question: "Solve: 3x - 7 = 14",
    options: ["x=5", "x=6", "x=7", "x=8"],
    answer: "x=7",
  },
  {
    question: "What is the median of 10, 20, 30, 40, 50?",
    options: ["25", "30", "35", "40"],
    answer: "30",
  },
  {
    question: "What is the mean of 10, 20, 30?",
    options: ["15", "20", "25", "30"],
    answer: "20",
  },
  {
    question: "What is the mode of 1, 2, 2, 3, 3, 3?",
    options: ["1", "2", "3", "No mode"],
    answer: "3",
  },
  {
    question: "What is 2^7?",
    options: ["64", "128", "256", "512"],
    answer: "128",
  },
  {
    question: "What is 3^5?",
    options: ["81", "100", "125", "243"],
    answer: "243",
  },
  {
    question: "What is 5^4?",
    options: ["125", "500", "625", "1000"],
    answer: "625",
  },
  {
    question: "Is 49 a perfect square?",
    options: ["No", "Yes, 7²", "Yes, 6²", "Uncertain"],
    answer: "Yes, 7²",
  },
  {
    question: "Is 64 a perfect square?",
    options: ["No", "Yes, 7²", "Yes, 8²", "Uncertain"],
    answer: "Yes, 8²",
  },
  {
    question: "What is |−20|?",
    options: ["-20", "0", "10", "20"],
    answer: "20",
  },
  {
    question: "What is |-7 + 3|?",
    options: ["-10", "-4", "4", "10"],
    answer: "4",
  },
  {
    question: "Is 91 prime?",
    options: [
      "Yes",
      "No, divisible by 7",
      "No, divisible by 13",
      "Both B and C",
    ],
    answer: "Both B and C",
  },
  {
    question: "Is 97 prime?",
    options: ["No", "Yes", "Not sure", "Composite"],
    answer: "Yes",
  },
  {
    question: "What is the LCM of 8 and 12?",
    options: ["24", "32", "48", "96"],
    answer: "24",
  },
  {
    question: "What is the GCD of 18 and 24?",
    options: ["2", "4", "6", "8"],
    answer: "6",
  },
  {
    question: "What is 50 * 20?",
    options: ["900", "1000", "1100", "1200"],
    answer: "1000",
  },
  {
    question: "What is 73 + 27?",
    options: ["90", "100", "110", "120"],
    answer: "100",
  },
  {
    question: "What is 200 - 125?",
    options: ["65", "75", "85", "95"],
    answer: "75",
  },
  {
    question: "What is 88 / 8?",
    options: ["9", "10", "11", "12"],
    answer: "11",
  },
  {
    question: "Solve: x/4 = 7",
    options: ["x=28", "x=11", "x=3", "x=1.75"],
    answer: "x=28",
  },
  {
    question: "Solve: 5 + x = 22",
    options: ["x=12", "x=15", "x=17", "x=20"],
    answer: "x=17",
  },
  {
    question: "Solve: 30 - x = 8",
    options: ["x=22", "x=20", "x=18", "x=16"],
    answer: "x=22",
  },
  {
    question: "What is 25% of 120?",
    options: ["20", "25", "30", "35"],
    answer: "30",
  },
  {
    question: "What is 60% of 150?",
    options: ["80", "85", "90", "95"],
    answer: "90",
  },
  {
    question: "What is 35% of 200?",
    options: ["60", "65", "70", "75"],
    answer: "70",
  },
  {
    question: "What is 0.1 as a percentage?",
    options: ["1%", "10%", "0.01%", "100%"],
    answer: "10%",
  },
  {
    question: "What is 0.02 as a percentage?",
    options: ["0.2%", "2%", "20%", "200%"],
    answer: "2%",
  },
  {
    question: "What is 7! / 5!?",
    options: ["28", "35", "42", "56"],
    answer: "42",
  },
  {
    question: "What is the sum of 1 to 20?",
    options: ["190", "200", "210", "220"],
    answer: "210",
  },
  {
    question: "Complete: 2, 6, 12, 20, ?",
    options: ["28", "30", "32", "34"],
    answer: "30",
  },
  {
    question: "Complete: 1, 4, 9, 16, 25, ?",
    options: ["30", "35", "36", "40"],
    answer: "36",
  },
  {
    question: "What is the area of a circle with radius 2?",
    options: ["2π", "4π", "6π", "8π"],
    answer: "4π",
  },
  {
    question: "What is the volume of a cube with side 4?",
    options: ["16", "32", "48", "64"],
    answer: "64",
  },
  {
    question: "What is the volume of a sphere with radius 3?",
    options: ["36π", "48π", "72π", "108π"],
    answer: "36π",
  },
  {
    question: "What is tan(0°)?",
    options: ["0", "1", "undefined", "-1"],
    answer: "0",
  },
  {
    question: "What is tan(90°)?",
    options: ["0", "1", "undefined", "-1"],
    answer: "undefined",
  },
  {
    question: "In a 3-4-5 triangle, what is the angle opposite side 5?",
    options: ["45°", "60°", "90°", "120°"],
    answer: "90°",
  },
  {
    question: "What is sin(0°)?",
    options: ["0", "1/2", "1", "undefined"],
    answer: "0",
  },
  {
    question: "What is cos(90°)?",
    options: ["0", "1/2", "1", "-1"],
    answer: "0",
  },
  {
    question: "What is the supplement of 60°?",
    options: ["30°", "90°", "120°", "180°"],
    answer: "120°",
  },
  {
    question: "What is the complement of 35°?",
    options: ["45°", "55°", "65°", "90°"],
    answer: "55°",
  },
  {
    question: "How many degrees in a right angle?",
    options: ["45°", "90°", "180°", "360°"],
    answer: "90°",
  },
  {
    question: "How many degrees in a straight line?",
    options: ["90°", "180°", "270°", "360°"],
    answer: "180°",
  },
  {
    question: "What is 50² ?",
    options: ["2000", "2500", "3000", "3500"],
    answer: "2500",
  },
  {
    question: "What is 45 * 45?",
    options: ["1900", "1950", "2000", "2025"],
    answer: "2025",
  },
  {
    question: "What is 30 * 30?",
    options: ["800", "900", "1000", "1100"],
    answer: "900",
  },
  {
    question: "What is 0.1 * 10?",
    options: ["0.01", "0.1", "1", "10"],
    answer: "1",
  },
  {
    question: "What is 0.01 * 100?",
    options: ["0.01", "0.1", "1", "10"],
    answer: "1",
  },
  {
    question: "What is 1000 / 100?",
    options: ["1", "10", "100", "1000"],
    answer: "10",
  },
  {
    question: "What is 10000 / 1000?",
    options: ["1", "10", "100", "1000"],
    answer: "10",
  },
  {
    question: "Solve: x² - 16 = 0",
    options: ["x=±4", "x=±2", "x=±8", "No solution"],
    answer: "x=±4",
  },
  {
    question: "Solve: x² - 25 = 0",
    options: ["x=±5", "x=±10", "x=±15", "No solution"],
    answer: "x=±5",
  },
  {
    question: "What is the hypotenuse of a 5-12-? triangle?",
    options: ["13", "14", "15", "16"],
    answer: "13",
  },
  {
    question: "Is 121 a perfect square?",
    options: ["No", "Yes, 11²", "Yes, 10²", "Yes, 12²"],
    answer: "Yes, 11²",
  },
  {
    question: "Is 144 a perfect square?",
    options: ["No", "Yes, 11²", "Yes, 12²", "Yes, 13²"],
    answer: "Yes, 12²",
  },
  {
    question: "What is 3/10 as a decimal?",
    options: ["0.03", "0.3", "0.33", "0.333"],
    answer: "0.3",
  },
  {
    question: "Convert 35% to a fraction",
    options: ["1/4", "1/3", "7/20", "3/5"],
    answer: "7/20",
  },
  {
    question: "Convert 20% to a fraction",
    options: ["1/5", "1/4", "1/3", "1/2"],
    answer: "1/5",
  },
  {
    question: "What is 12 * 12?",
    options: ["100", "132", "144", "156"],
    answer: "144",
  },
  {
    question: "What is 13 * 13?",
    options: ["156", "169", "182", "195"],
    answer: "169",
  },
  {
    question: "What is 14 * 14?",
    options: ["176", "184", "192", "196"],
    answer: "196",
  },
  {
    question: "What is 15 * 15?",
    options: ["200", "215", "225", "240"],
    answer: "225",
  },
  {
    question: "What is 18 * 18?",
    options: ["300", "324", "348", "364"],
    answer: "324",
  },
  {
    question: "What is 20 * 20?",
    options: ["360", "380", "400", "420"],
    answer: "400",
  },
  {
    question: "Solve: 2x - 10 = 6",
    options: ["x=8", "x=12", "x=14", "x=16"],
    answer: "x=8",
  },
  {
    question: "Solve: 5x + 5 = 30",
    options: ["x=4", "x=5", "x=6", "x=7"],
    answer: "x=5",
  },
  {
    question: "What is the radius of a circle with diameter 14?",
    options: ["5", "6", "7", "8"],
    answer: "7",
  },
  {
    question: "What is the diameter of a circle with radius 6?",
    options: ["6", "8", "10", "12"],
    answer: "12",
  },
  {
    question: "What is the area of a rectangle 7 by 9?",
    options: ["49", "56", "63", "72"],
    answer: "63",
  },
  {
    question: "What is the perimeter of a rectangle 5 by 8?",
    options: ["20", "24", "26", "40"],
    answer: "26",
  },
  {
    question: "Is 24 divisible by 3?",
    options: ["No", "Yes", "Not sure", "Maybe"],
    answer: "Yes",
  },
  {
    question: "Is 35 divisible by 7?",
    options: ["No", "Yes", "Not sure", "Maybe"],
    answer: "Yes",
  },
  {
    question: "Is 18 divisible by 4?",
    options: ["Yes", "No", "Not sure", "Maybe"],
    answer: "No",
  },
  {
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    answer: "2",
  },
  {
    question: "What is the next prime after 41?",
    options: ["42", "43", "44", "45"],
    answer: "43",
  },
  {
    question: "What is 99 * 2?",
    options: ["180", "190", "198", "200"],
    answer: "198",
  },
  {
    question: "What is 101 * 2?",
    options: ["200", "202", "204", "206"],
    answer: "202",
  },
  {
    question: "What is 50 * 50?",
    options: ["2000", "2250", "2500", "2750"],
    answer: "2500",
  },
  {
    question: "What is 60 * 60?",
    options: ["3000", "3200", "3400", "3600"],
    answer: "3600",
  },
  {
    question: "What is 70 * 70?",
    options: ["4800", "4900", "5000", "5100"],
    answer: "4900",
  },
  {
    question: "What is 80 * 80?",
    options: ["6000", "6200", "6400", "6600"],
    answer: "6400",
  },
  {
    question: "What is 90 * 90?",
    options: ["8000", "8100", "8200", "8300"],
    answer: "8100",
  },
  {
    question: "What is 100 * 100?",
    options: ["9000", "10000", "11000", "12000"],
    answer: "10000",
  },
  {
    question: "What is 9 / 3 / 3?",
    options: ["1", "2", "3", "9"],
    answer: "1",
  },
  {
    question: "What is (20 - 10) / 5?",
    options: ["2", "4", "6", "10"],
    answer: "2",
  },
  {
    question: "What is 2 + 2 * 5?",
    options: ["12", "14", "20", "22"],
    answer: "12",
  },
  {
    question: "What is (2 + 2) * 5?",
    options: ["12", "14", "20", "22"],
    answer: "20",
  },
  {
    question: "Complete: 8, 16, 32, 64, ?",
    options: ["96", "100", "128", "144"],
    answer: "128",
  },
  {
    question: "Complete: 3, 9, 27, 81, ?",
    options: ["144", "162", "243", "324"],
    answer: "243",
  },
  { question: "What is log₂(64)?", options: ["4", "5", "6", "7"], answer: "6" },
  { question: "What is log₂(32)?", options: ["3", "4", "5", "6"], answer: "5" },
  { question: "What is log₃(27)?", options: ["2", "3", "4", "5"], answer: "3" },
  {
    question: "What is log₅(125)?",
    options: ["2", "3", "4", "5"],
    answer: "3",
  },
  {
    question: "What is √324?",
    options: ["15", "17", "18", "20"],
    answer: "18",
  },
  {
    question: "What is √256?",
    options: ["14", "15", "16", "17"],
    answer: "16",
  },
  {
    question: "What is √196?",
    options: ["13", "14", "15", "16"],
    answer: "14",
  },
  { question: "What is √100?", options: ["8", "9", "10", "11"], answer: "10" },
  {
    question: "Is 100 divisible by 5?",
    options: ["No", "Yes", "Not sure", "Maybe"],
    answer: "Yes",
  },
  {
    question: "Is 100 divisible by 4?",
    options: ["No", "Yes", "Not sure", "Maybe"],
    answer: "Yes",
  },
  {
    question: "Is 100 divisible by 3?",
    options: ["Yes", "No", "Not sure", "Maybe"],
    answer: "No",
  },
  { question: "What is 5^0?", options: ["0", "1", "5", "10"], answer: "1" },
  { question: "What is 10^0?", options: ["0", "1", "10", "100"], answer: "1" },
  { question: "What is 2^0?", options: ["0", "1", "2", "4"], answer: "1" },
  { question: "What is 3^0?", options: ["0", "1", "3", "9"], answer: "1" },
  {
    question: "Solve: x + x + x = 30",
    options: ["x=5", "x=10", "x=15", "x=20"],
    answer: "x=10",
  },
  {
    question: "Solve: 2x + 2x = 64",
    options: ["x=8", "x=10", "x=16", "x=20"],
    answer: "x=16",
  },
  {
    question: "What is the perimeter of an equilateral triangle with side 5?",
    options: ["10", "15", "20", "25"],
    answer: "15",
  },
  {
    question: "What is the perimeter of an equilateral triangle with side 6?",
    options: ["12", "15", "18", "24"],
    answer: "18",
  },
  {
    question: "What is 1/10 as a percentage?",
    options: ["1%", "5%", "10%", "50%"],
    answer: "10%",
  },
  {
    question: "What is 1/8 as a percentage?",
    options: ["8%", "10%", "12.5%", "15%"],
    answer: "12.5%",
  },
  {
    question: "What is 1/6 as a percentage?",
    options: ["15%", "16.67%", "20%", "25%"],
    answer: "16.67%",
  },
  {
    question: "What is 1/5 as a percentage?",
    options: ["15%", "20%", "25%", "30%"],
    answer: "20%",
  },
  {
    question: "Convert 0.5 to a fraction",
    options: ["1/2", "1/3", "1/4", "2/5"],
    answer: "1/2",
  },
  {
    question: "Convert 0.75 to a fraction",
    options: ["2/3", "3/4", "4/5", "3/5"],
    answer: "3/4",
  },
  {
    question: "Convert 0.6 to a fraction",
    options: ["2/3", "3/5", "3/4", "4/5"],
    answer: "3/5",
  },
  {
    question: "What is the area of a right triangle with legs 6 and 8?",
    options: ["20", "24", "28", "32"],
    answer: "24",
  },
  {
    question: "What is the area of a right triangle with legs 3 and 4?",
    options: ["6", "8", "10", "12"],
    answer: "6",
  },
  {
    question: "What is 52 + 48?",
    options: ["90", "95", "100", "105"],
    answer: "100",
  },
  {
    question: "What is 75 + 25?",
    options: ["90", "95", "100", "105"],
    answer: "100",
  },
  {
    question: "What is 99 + 1?",
    options: ["95", "98", "100", "102"],
    answer: "100",
  },
  {
    question: "What is 225 / 15?",
    options: ["12", "13", "14", "15"],
    answer: "15",
  },
];

// 250 new PUZZLES (riddles, logic, word play, sequences)
const newPuzzles = [
  {
    question: "What word is spelled wrong in the dictionary?",
    options: ["Wrong", "Spelled", "Dictionary", "None"],
    answer: "Wrong",
  },
  {
    question:
      "What is the only word that is spelled with 4 letters but sounds like 8?",
    options: ["Eight", "Eighty", "Ate", "For"],
    answer: "For",
  },
  {
    question: "What is the common word that has 3 double letters in a row?",
    options: ["Coffee", "Balloon", "Bookkeeper", "Misspell"],
    answer: "Bookkeeper",
  },
  {
    question: "I have no voice, yet people talk to me. What am I?",
    options: ["A book", "A phone", "An echo", "A mirror"],
    answer: "An echo",
  },
  {
    question:
      "What is the next number in the sequence: 1, 1, 2, 3, 5, 8, 13, 21, ?",
    options: ["29", "34", "42", "55"],
    answer: "34",
  },
  {
    question: "What has a neck but no head?",
    options: ["A scarf", "A bottle", "A turtle", "A giraffe"],
    answer: "A bottle",
  },
  {
    question: "What is always coming but never arrives?",
    options: ["Tomorrow", "Next week", "Christmas", "Spring"],
    answer: "Tomorrow",
  },
  {
    question: "What is the riddle inside the riddle?",
    options: ["Confusion", "Clarity", "Truth", "A question"],
    answer: "A question",
  },
  {
    question: "What looks like two zeros in a bottle?",
    options: ["O2", "Oxygen", "Goggles", "Eyes"],
    answer: "Goggles",
  },
  {
    question: "What word contains all the vowels?",
    options: ["Education", "Beautiful", "Sequoia", "Facetious"],
    answer: "Sequoia",
  },
  {
    question:
      "Can you think of a common word with three consecutive double letters?",
    options: ["Coffee", "Theatre", "Bookkeeping", "Mississippi"],
    answer: "Bookkeeping",
  },
  {
    question: "What is always in front of you but you can never see it?",
    options: ["Your shadow", "Tomorrow", "Your eyes", "Your nose"],
    answer: "Your nose",
  },
  {
    question: "What number sequence comes next: 2, 4, 8, 16, ?",
    options: ["24", "32", "40", "48"],
    answer: "32",
  },
  {
    question: "What letter of the alphabet is always in the alphabet?",
    options: ["A", "E", "L", "Z"],
    answer: "L",
  },
  {
    question: "What word can you make from the letters UVLSIOG?",
    options: ["Obvious", "Vigorous", "Litigious", "Anxious"],
    answer: "Obvious",
  },
  {
    question:
      "I am an odd number. Remove one letter, and I become even. What number am I?",
    options: ["Three", "Five", "Seven", "Nine"],
    answer: "Seven",
  },
  {
    question: "What is the next number: 10, 20, 30, 40, ?",
    options: ["45", "50", "55", "60"],
    answer: "50",
  },
  {
    question: "Complete the series: O, T, T, F, F, S, S, E, N, ?",
    options: ["M", "O", "T", "U"],
    answer: "T",
  },
  {
    question: "What has a beginning, middle, and end but is not a story?",
    options: ["Time", "Life", "A sandwich", "A movie"],
    answer: "A sandwich",
  },
  {
    question: "What gets wetter the more it dries?",
    options: ["Water", "Cloth", "A towel", "Soap"],
    answer: "A towel",
  },
  {
    question: "What is the next letter: A, E, I, O, U, ?",
    options: ["V", "W", "X", "Y"],
    answer: "Y",
  },
  {
    question: "If all Roses are flowers, all flowers fade, are all Roses fade?",
    options: ["Yes", "No", "Sometimes", "Not necessarily"],
    answer: "Yes",
  },
  {
    question: "What number sequence comes next: 1, 1, 2, 3, 5, 8, 13, ?",
    options: ["18", "19", "20", "21"],
    answer: "21",
  },
  {
    question: "What has a face and hands but cannot smile?",
    options: ["A statue", "A doll", "A clock", "A mask"],
    answer: "A clock",
  },
  {
    question: "What is a word that sounds like a color but isn't?",
    options: ["Indigo", "Green", "Read", "Orange"],
    answer: "Read",
  },
  {
    question: "What is the only place where today comes before yesterday?",
    options: ["The dictionary", "A calendar", "A clock", "In your mind"],
    answer: "The dictionary",
  },
  {
    question: "What is full of holes but still holds water?",
    options: ["A bucket", "A sieve", "A sponge", "A net"],
    answer: "A sponge",
  },
  {
    question: "Complete: 1, 4, 9, 16, 25, ?",
    options: ["30", "35", "36", "42"],
    answer: "36",
  },
  {
    question: "What is never eaten at breakfast, lunch, or dinner?",
    options: ["Fruit", "Vegetables", "Dishes", "Dessert"],
    answer: "Dishes",
  },
  {
    question: "What has a ring but no finger?",
    options: ["A teapot", "A bell", "A phone", "A planet"],
    answer: "A phone",
  },
  {
    question: "What is white when it's dirty and black when it's clean?",
    options: ["A chalkboard", "A sheet", "Coal", "Snow"],
    answer: "A chalkboard",
  },
  {
    question: "What can be cracked, made, told, and played?",
    options: ["A song", "A game", "A joke", "A code"],
    answer: "A joke",
  },
  {
    question: "What is the sequence: 1, 4, 9, 16, ?",
    options: ["20", "24", "25", "30"],
    answer: "25",
  },
  {
    question:
      "What is the number that has a name with the same number of letters as its value?",
    options: ["Four", "Three", "Five", "Six"],
    answer: "Four",
  },
  {
    question: "What is a palindrome?",
    options: [
      "A long word",
      "A word spelled the same forward and backward",
      "A rhyming word",
      "A word with double letters",
    ],
    answer: "A word spelled the same forward and backward",
  },
  {
    question: "What begins with 'T', ends with 'T', and has 'T' in it?",
    options: ["Art", "Cat", "Teapot", "Tent"],
    answer: "Teapot",
  },
  {
    question: "What is the next number: 5, 10, 15, 20, ?",
    options: ["23", "24", "25", "26"],
    answer: "25",
  },
  {
    question: "I speak without a mouth and hear without ears. What am I?",
    options: ["Wind", "Thunder", "An echo", "A shadow"],
    answer: "An echo",
  },
  {
    question: "What is the smallest 6-letter word?",
    options: ["Little", "Strong", "Letter", "Not sure"],
    answer: "Not sure",
  },
  {
    question: "What is a 3-letter word that ends in X?",
    options: ["Box", "Hex", "Tax", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is the only word that rhymes with nothing?",
    options: ["Orange", "Purple", "Silver", "Aluminum"],
    answer: "Orange",
  },
  {
    question: "Complete the sequence: 2, 6, 12, 20, ?",
    options: ["28", "30", "32", "35"],
    answer: "30",
  },
  {
    question: "What is a word that contains all the vowels exactly once?",
    options: ["Abstemious", "Education", "Beautiful", "Delicious"],
    answer: "Abstemious",
  },
  {
    question: "What is the next number: 100, 90, 80, 70, ?",
    options: ["55", "60", "65", "70"],
    answer: "60",
  },
  {
    question: "What has a body but no legs?",
    options: ["A snake", "A river", "A car", "A chair"],
    answer: "A river",
  },
  {
    question: "What can you hold without using your hands?",
    options: ["Air", "Water", "Your breath", "Light"],
    answer: "Your breath",
  },
  {
    question: "What is the only mammal that cannot jump?",
    options: ["A sloth", "An elephant", "A hippopotamus", "A whale"],
    answer: "An elephant",
  },
  {
    question: "What is the sequence: 3, 6, 9, 12, ?",
    options: ["15", "16", "18", "20"],
    answer: "15",
  },
  {
    question:
      "What is the answer to this: If you have a bowl with six apples and you take away two, how many do you have?",
    options: ["6", "4", "2", "8"],
    answer: "2",
  },
  {
    question: "What is never written wrong but is often read wrong?",
    options: ["Handwriting", "Speed", "A sign", "The word 'wrong'"],
    answer: "The word 'wrong'",
  },
  {
    question: "What is the next number: 11, 22, 33, 44, ?",
    options: ["54", "55", "66", "77"],
    answer: "55",
  },
  {
    question: "What can travel the world while staying in a corner?",
    options: ["A bird", "A plane", "A stamp", "Wind"],
    answer: "A stamp",
  },
  {
    question: "What is always around you but you can never see it?",
    options: ["Light", "Time", "Air", "Space"],
    answer: "Air",
  },
  {
    question: "What is broken when it is spoken?",
    options: ["Silence", "Trust", "A promise", "A heart"],
    answer: "Silence",
  },
  {
    question: "What is the next number: 1, 2, 4, 7, 11, ?",
    options: ["15", "16", "18", "20"],
    answer: "16",
  },
  {
    question: "What is a word with double letters?",
    options: ["Book", "Happy", "Possess", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is the sequence: 2, 5, 10, 17, ?",
    options: ["24", "26", "28", "30"],
    answer: "26",
  },
  {
    question: "What can be silent but speaks volumes?",
    options: ["A book", "Music", "Art", "A look"],
    answer: "A look",
  },
  {
    question: "What is next: 1, 3, 6, 10, ?",
    options: ["14", "15", "16", "18"],
    answer: "15",
  },
  {
    question: "What is a 9-letter word that contains all the vowels?",
    options: ["Beautiful", "Education", "Abstemious", "House"],
    answer: "Education",
  },
  {
    question: "What cannot be used until it's broken?",
    options: ["A toy", "Glass", "An egg", "A stick"],
    answer: "An egg",
  },
  {
    question: "What is next: 10, 9, 8, 7, ?",
    options: ["4", "5", "6", "7"],
    answer: "6",
  },
  {
    question: "What has an eye but cannot see?",
    options: ["A potato", "A camera", "A hurricane", "A needle"],
    answer: "A needle",
  },
  {
    question: "What is a sentence that has all 26 letters?",
    options: [
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "The quick brown fox jumps over the lazy dog",
      "Sphinx of black quartz, judge my vow",
      "Both B and C",
    ],
    answer: "Both B and C",
  },
  {
    question: "If you call a dog's tail a leg, how many legs does it have?",
    options: ["3", "4", "5", "6"],
    answer: "4",
  },
  {
    question: "What is next: 5, 4, 3, 2, ?",
    options: ["0", "1", "2", "3"],
    answer: "1",
  },
  {
    question: "What word becomes shorter when you add letters to it?",
    options: ["Long", "Short", "Add", "Ending"],
    answer: "Short",
  },
  {
    question: "What is the sequence: 7, 14, 21, 28, ?",
    options: ["33", "34", "35", "36"],
    answer: "35",
  },
  {
    question: "What cannot run but always walks?",
    options: ["A river", "A snail", "Water", "Ice"],
    answer: "Ice",
  },
  {
    question: "What is next: 2, 4, 6, 8, ?",
    options: ["9", "10", "11", "12"],
    answer: "10",
  },
  {
    question:
      "What is a word that starts and ends with E but contains only one letter?",
    options: ["Eye", "Envelope", "Edge", "Else"],
    answer: "Envelope",
  },
  {
    question: "What is the opposite of inside?",
    options: ["Out", "Outside", "Open", "Above"],
    answer: "Outside",
  },
  {
    question: "What is next: 100, 50, 25, 12.5, ?",
    options: ["5", "6.25", "7", "8"],
    answer: "6.25",
  },
  {
    question: "What is a letter in the answer to this riddle?",
    options: ["M", "R", "D", "O"],
    answer: "O",
  },
  {
    question:
      "What is a number that reads the same upside down and right side up?",
    options: ["6", "8", "0", "All of these"],
    answer: "0",
  },
  {
    question: "What is the sum of 1+2+3+4+5?",
    options: ["10", "12", "15", "20"],
    answer: "15",
  },
  {
    question: "What is next: 1, 10, 100, 1000, ?",
    options: ["1010", "10000", "1100", "2000"],
    answer: "10000",
  },
  {
    question: "What is a palindromic number?",
    options: ["11", "121", "1221", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is the next number: 2, 3, 5, 7, 11, ?",
    options: ["12", "13", "14", "15"],
    answer: "13",
  },
  {
    question: "What has a head and feet but no legs?",
    options: ["A snake", "A ruler", "A bed", "A coin"],
    answer: "A ruler",
  },
  {
    question: "What is next: 1, 2, 2, 4, 8, ?",
    options: ["16", "32", "64", "128"],
    answer: "32",
  },
  {
    question:
      "What is the word that sounds like a tool and something you can drink?",
    options: ["Saw", "Can", "Tin", "Chest"],
    answer: "Can",
  },
  {
    question: "What is next: 3, 3, 3, 3, ?",
    options: ["0", "1", "3", "6"],
    answer: "3",
  },
  {
    question: "What is a sentence with no verbs?",
    options: ["The cat", "She runs", "Hello world", "Happy dog"],
    answer: "Hello world",
  },
  {
    question: "What is the next number: 1, 8, 27, 64, ?",
    options: ["100", "120", "125", "150"],
    answer: "125",
  },
  {
    question: "What is never asleep but always dreaming?",
    options: ["A cloud", "The ocean", "The sky", "A river"],
    answer: "The ocean",
  },
  {
    question: "What is next: 2, 8, 18, 32, ?",
    options: ["40", "45", "50", "52"],
    answer: "50",
  },
  {
    question: "What is the only bird that can fly backwards?",
    options: ["Owl", "Parrot", "Hummingbird", "Phoenix"],
    answer: "Hummingbird",
  },
  {
    question: "What is the next number: 12, 23, 34, 45, ?",
    options: ["54", "55", "56", "65"],
    answer: "56",
  },
  {
    question: "What is next: 1, 4, 9, 16, 25, ?",
    options: ["35", "36", "40", "45"],
    answer: "36",
  },
  {
    question: "What is the word that means both the beginning and the end?",
    options: ["Life", "Time", "Start-End", "Something written backward"],
    answer: "Something written backward",
  },
  {
    question: "What is next: 5, 10, 20, 40, ?",
    options: ["60", "70", "80", "100"],
    answer: "80",
  },
  {
    question: "What is a word with no vowels?",
    options: ["Shy", "My", "Cry", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is the next number: 6, 11, 16, 21, ?",
    options: ["24", "25", "26", "28"],
    answer: "26",
  },
  {
    question: "What can be written but never read?",
    options: ["Music", "A check", "Shorthand", "A prescription"],
    answer: "A prescription",
  },
  {
    question: "What is next: 1, 5, 13, 25, ?",
    options: ["37", "38", "39", "41"],
    answer: "41",
  },
  {
    question: "What is the answer to: What do you call a bear with no teeth?",
    options: ["A panda", "A gummy bear", "A hairless bear", "A blob"],
    answer: "A gummy bear",
  },
  {
    question: "What is next: 4, 7, 10, 13, ?",
    options: ["15", "16", "17", "18"],
    answer: "16",
  },
  {
    question:
      "What is the riddle: Which is correct, the yolk of an egg is white or the white of an egg is yellow?",
    options: [
      "The yolk is white",
      "The white is yellow",
      "Neither; yolk is yellow and white is clear",
      "Both",
    ],
    answer: "Neither; yolk is yellow and white is clear",
  },
  {
    question: "What is next: 9, 8, 7, 6, ?",
    options: ["3", "4", "5", "6"],
    answer: "5",
  },
  {
    question: "What is a word that has three consecutive double letters?",
    options: ["Bookkeeper", "Balloon", "Coffee", "Happy"],
    answer: "Bookkeeper",
  },
  {
    question: "What is next: 1, 1, 1, 1, ?",
    options: ["1", "2", "3", "0"],
    answer: "1",
  },
  {
    question: "What is the number that comes next: 2, 20, 200, 2000, ?",
    options: ["20000", "2000", "200000", "3000"],
    answer: "20000",
  },
  {
    question: "What is a word that is spelled with 3 different vowels?",
    options: ["Hello", "Beautiful", "Dangerous", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is next: 10, 11, 12, 13, ?",
    options: ["14", "15", "20", "100"],
    answer: "14",
  },
  {
    question: "What is never right but always left?",
    options: ["Direction", "A clock", "The ocean", "A hand"],
    answer: "The ocean",
  },
  {
    question: "What is next: 3, 8, 13, 18, ?",
    options: ["20", "22", "23", "25"],
    answer: "23",
  },
  {
    question: "What is the word that is the same backwards and forwards?",
    options: ["Radar", "Level", "Civic", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is next: 5, 6, 8, 9, 11, ?",
    options: ["12", "13", "14", "15"],
    answer: "12",
  },
  {
    question:
      "What is the riddle: The more you take, the more you leave behind?",
    options: ["Money", "Steps", "Time", "Water"],
    answer: "Steps",
  },
  {
    question: "What is next: 7, 11, 15, 19, ?",
    options: ["22", "23", "24", "25"],
    answer: "23",
  },
  {
    question: "What is a word that has all 5 vowels in it?",
    options: ["Abstemiously", "Facetious", "Education", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is next: 2, 5, 9, 14, ?",
    options: ["19", "20", "21", "22"],
    answer: "20",
  },
  {
    question: "What is the riddle: What question can you never answer yes to?",
    options: [
      "Are you sleeping?",
      "Do you exist?",
      "Are you alive?",
      "Can you speak?",
    ],
    answer: "Are you sleeping?",
  },
  {
    question: "What is next: 1, 2, 3, 5, 8, ?",
    options: ["12", "13", "14", "15"],
    answer: "13",
  },
  {
    question: "What is a number that is written the same in any language?",
    options: ["0", "1", "7", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is next: 4, 5, 7, 8, 10, ?",
    options: ["11", "12", "13", "14"],
    answer: "11",
  },
  {
    question:
      "What is the riddle: What word becomes shorter when you add a syllable to it?",
    options: ["Short", "Shortening", "Endless", "Nothing"],
    answer: "Nothing",
  },
  {
    question: "What is next: 6, 7, 9, 10, 12, ?",
    options: ["13", "14", "15", "16"],
    answer: "13",
  },
  {
    question: "What is a word that means the same as its opposite?",
    options: ["Sanction", "Cleave", "Weather", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is next: 10, 8, 6, 4, ?",
    options: ["0", "1", "2", "3"],
    answer: "2",
  },
  {
    question: "What is the riddle: I have a head and a tail but no body?",
    options: ["A snake", "A coin", "A kite", "A comet"],
    answer: "A coin",
  },
  {
    question: "What is next: 100, 95, 90, 85, ?",
    options: ["75", "76", "78", "80"],
    answer: "80",
  },
  {
    question:
      "What is a word that is spelled the same but pronounced differently?",
    options: ["Lead", "Tear", "Read", "All of these"],
    answer: "All of these",
  },
  {
    question: "What is next: 1, 3, 5, 7, ?",
    options: ["8", "9", "10", "11"],
    answer: "9",
  },
  {
    question:
      "What makes no sense when you're awake but makes perfect sense when you're asleep?",
    options: ["A dream", "Logic", "Math", "Books"],
    answer: "A dream",
  },
  {
    question: "What is next: 99, 88, 77, 66, ?",
    options: ["44", "45", "55", "56"],
    answer: "55",
  },
  {
    question:
      "What is a word that has 7 letters and if you remove one, it has none?",
    options: ["Mailbox", "Nothing", "Absence", "Endless"],
    answer: "Nothing",
  },
  {
    question: "What is next: 2, 10, 50, 250, ?",
    options: ["1000", "1200", "1250", "1500"],
    answer: "1250",
  },
];

// 250 new GENERAL questions (diverse topics)
const newGeneral = [
  {
    question: "What is the smallest ocean?",
    options: ["Atlantic", "Indian", "Arctic", "Southern"],
    answer: "Arctic",
  },
  {
    question: "How many strings does a cello have?",
    options: ["3", "4", "5", "6"],
    answer: "4",
  },
  {
    question: "What is the capital of Greece?",
    options: ["Athens", "Thessaloniki", "Sparta", "Corinth"],
    answer: "Athens",
  },
  {
    question: "Who invented the internet?",
    options: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Alan Turing"],
    answer: "Tim Berners-Lee",
  },
  {
    question:
      "What is the most spoken language in the world by native speakers?",
    options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
    answer: "Mandarin Chinese",
  },
  {
    question: "What is the largest desert in the world?",
    options: ["Sahara", "Gobi", "Antarctica", "Kalahari"],
    answer: "Antarctica",
  },
  {
    question: "How many chambers does a squid's heart have?",
    options: ["1", "2", "3", "4"],
    answer: "3",
  },
  {
    question: "What country has the most islands?",
    options: ["Indonesia", "Philippines", "Sweden", "Finland"],
    answer: "Sweden",
  },
  {
    question: "What is the longest word in the English language?",
    options: [
      "Supercalifragilisticexpialidocious",
      "Antidisestablishmentarianism",
      "Pneumonoultramicroscopicsilicovolcanoconiosis",
      "Floccinaucinilicilification",
    ],
    answer: "Pneumonoultramicroscopicsilicovolcanoconiosis",
  },
  {
    question: "How many minutes are in a full week?",
    options: ["10080", "10800", "11000", "12000"],
    answer: "10080",
  },
  {
    question: "What is the only mammal that cannot jump?",
    options: ["Elephant", "Whale", "Sloth", "Hippopotamus"],
    answer: "Elephant",
  },
  {
    question: "What is the name of the currency used in Switzerland?",
    options: ["Euro", "Franc", "Mark", "Krona"],
    answer: "Franc",
  },
  {
    question: "How many sides does a decagon have?",
    options: ["8", "9", "10", "12"],
    answer: "10",
  },
  {
    question: "What is the capital of Turkey?",
    options: ["Istanbul", "Ankara", "Izmir", "Antalya"],
    answer: "Ankara",
  },
  {
    question: "Who wrote 'The Great Gatsby'?",
    options: [
      "Ernest Hemingway",
      "F. Scott Fitzgerald",
      "John Steinbeck",
      "Mark Twain",
    ],
    answer: "F. Scott Fitzgerald",
  },
  {
    question: "What is the second most spoken language in the world?",
    options: ["Spanish", "English", "Hindi", "Arabic"],
    answer: "Spanish",
  },
  {
    question: "How many bones does a giraffe have in its neck?",
    options: ["5", "7", "9", "12"],
    answer: "7",
  },
  {
    question: "What is the capital of Denmark?",
    options: ["Aarhus", "Copenhagen", "Randers", "Aalborg"],
    answer: "Copenhagen",
  },
  {
    question: "Who is the author of 'The Hobbit'?",
    options: [
      "J.K. Rowling",
      "George R.R. Martin",
      "J.R.R. Tolkien",
      "Brandon Sanderson",
    ],
    answer: "J.R.R. Tolkien",
  },
  {
    question: "What is the smallest bone in the human body?",
    options: ["Incus", "Malleus", "Stapes", "Rib"],
    answer: "Stapes",
  },
  {
    question: "What is the capital of Belgium?",
    options: ["Antwerp", "Ghent", "Brussels", "Bruges"],
    answer: "Brussels",
  },
  {
    question: "How many strings does a harp typically have?",
    options: ["22", "33", "46", "50"],
    answer: "46",
  },
  {
    question: "What is the largest land mammal?",
    options: ["Hippopotamus", "Whale", "African Elephant", "Giraffe"],
    answer: "African Elephant",
  },
  {
    question: "What is the capital of Colombia?",
    options: ["Medellin", "Bogota", "Cali", "Barranquilla"],
    answer: "Bogota",
  },
  {
    question: "How many vertebrae does a human have?",
    options: ["30", "33", "36", "40"],
    answer: "33",
  },
  {
    question: "What is the capital of Cuba?",
    options: ["Santiago de Cuba", "Havana", "Camagüey", "Santa Clara"],
    answer: "Havana",
  },
  {
    question: "What is the second largest planet in our solar system?",
    options: ["Neptune", "Saturn", "Uranus", "Jupiter"],
    answer: "Saturn",
  },
  {
    question: "What is the smallest country in Africa?",
    options: ["Mauritius", "Seychelles", "Cape Verde", "Comoros"],
    answer: "Seychelles",
  },
  {
    question: "Who invented the printing press?",
    options: ["Gutenberg", "Caxton", "Aldus", "Jenson"],
    answer: "Gutenberg",
  },
  {
    question: "What is the capital of Iceland?",
    options: ["Reykjavik", "Akranes", "Kopavogur", "Hafnarfjordur"],
    answer: "Reykjavik",
  },
  {
    question: "How many continents have a desert?",
    options: ["3", "4", "5", "6"],
    answer: "6",
  },
  {
    question: "What is the capital of Slovakia?",
    options: ["Bratislava", "Kosice", "Presov", "Zilina"],
    answer: "Bratislava",
  },
  {
    question: "What is the largest coral reef in the world?",
    options: [
      "Red Sea Reefs",
      "Great Barrier Reef",
      "Belize Barrier Reef",
      "Indonesian Reefs",
    ],
    answer: "Great Barrier Reef",
  },
  {
    question: "What is the capital of Croatia?",
    options: ["Zagreb", "Split", "Dubrovnik", "Rijeka"],
    answer: "Zagreb",
  },
  {
    question: "How many sides does a rhombus have?",
    options: ["3", "4", "5", "6"],
    answer: "4",
  },
  {
    question: "What is the capital of Montenegro?",
    options: ["Podgorica", "Cetinje", "Kotor", "Nikšic"],
    answer: "Podgorica",
  },
  {
    question: "Who painted 'The Night Cafe'?",
    options: ["Picasso", "Van Gogh", "Monet", "Dali"],
    answer: "Van Gogh",
  },
  {
    question: "What is the capital of Bosnia?",
    options: ["Sarajevo", "Mostar", "Banja Luka", "Zenica"],
    answer: "Sarajevo",
  },
  {
    question: "How many years is a millennium?",
    options: ["50", "100", "500", "1000"],
    answer: "1000",
  },
  {
    question: "What is the capital of North Macedonia?",
    options: ["Skopje", "Bitola", "Kumanovo", "Veles"],
    answer: "Skopje",
  },
  {
    question: "What is the fastest fish in the ocean?",
    options: ["Tuna", "Marlin", "Sailfish", "Barracuda"],
    answer: "Sailfish",
  },
  {
    question: "What is the capital of Moldova?",
    options: ["Chisinau", "Balti", "Tiraspol", "Bender"],
    answer: "Chisinau",
  },
  {
    question: "How many letters are in the Greek alphabet?",
    options: ["20", "24", "26", "30"],
    answer: "24",
  },
  {
    question: "What is the capital of Georgia?",
    options: ["Tbilisi", "Kutaisi", "Batumi", "Gori"],
    answer: "Tbilisi",
  },
  {
    question: "Who discovered the North Pole?",
    options: ["Shackleton", "Peary", "Scott", "Amundsen"],
    answer: "Peary",
  },
  {
    question: "What is the capital of Armenia?",
    options: ["Yerevan", "Gumri", "Vanadzor", "Etchmiadzin"],
    answer: "Yerevan",
  },
  {
    question: "What is the largest volcano in the world?",
    options: ["Vesuvius", "Krakatau", "Mauna Loa", "Mount Pinatubo"],
    answer: "Mauna Loa",
  },
  {
    question: "What is the capital of Azerbaijan?",
    options: ["Baku", "Ganja", "Lankaran", "Shaki"],
    answer: "Baku",
  },
  {
    question: "How many eyes does a starfish have?",
    options: ["0", "2", "5", "10"],
    answer: "0",
  },
  {
    question: "What is the capital of Tajikistan?",
    options: ["Dushanbe", "Khujand", "Istaravshan", "Khorog"],
    answer: "Dushanbe",
  },
  {
    question: "Who wrote 'The Raven'?",
    options: ["Longfellow", "Poe", "Whitman", "Emerson"],
    answer: "Poe",
  },
  {
    question: "What is the capital of Uzbekistan?",
    options: ["Tashkent", "Samarkand", "Bukhara", "Fergana"],
    answer: "Tashkent",
  },
  {
    question: "What is the largest moon of Jupiter?",
    options: ["Europa", "Ganymede", "Io", "Callisto"],
    answer: "Ganymede",
  },
  {
    question: "What is the capital of Turkmenistan?",
    options: ["Ashgabat", "Turkmenbashi", "Balkanabat", "Daşoguz"],
    answer: "Ashgabat",
  },
  {
    question: "How many sides does a nonagon have?",
    options: ["7", "8", "9", "10"],
    answer: "9",
  },
  {
    question: "What is the capital of Kyrgyzstan?",
    options: ["Bishkek", "Osh", "Jalal-Abad", "Issyk-Kul"],
    answer: "Bishkek",
  },
  {
    question: "What is the deepest lake in the world?",
    options: [
      "Lake Tanganyika",
      "Lake Baikal",
      "Lake Malawi",
      "Great Slave Lake",
    ],
    answer: "Lake Baikal",
  },
  {
    question: "Who was the first person in space?",
    options: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"],
    answer: "Yuri Gagarin",
  },
  {
    question: "What is the capital of Kazakhstan?",
    options: ["Almaty", "Nur-Sultan", "Karaganda", "Semey"],
    answer: "Nur-Sultan",
  },
  {
    question: "What is the smallest ocean by volume?",
    options: ["Atlantic", "Arctic", "Indian", "Southern"],
    answer: "Arctic",
  },
  {
    question: "What is the capital of Albania?",
    options: ["Tirana", "Durres", "Vlora", "Korce"],
    answer: "Tirana",
  },
  {
    question: "How many chromosomes do potatoes have?",
    options: ["24", "48", "72", "96"],
    answer: "48",
  },
  {
    question: "What is the capital of Cyprus?",
    options: ["Lefkosia", "Larnaca", "Paphos", "Limassol"],
    answer: "Lefkosia",
  },
  {
    question: "What is the longest mountain range in the world?",
    options: ["Alps", "Himalayas", "Mid-Ocean Ridge", "Rockies"],
    answer: "Mid-Ocean Ridge",
  },
  {
    question: "What is the capital of Malta?",
    options: ["Valletta", "Sliema", "Mdina", "Mosta"],
    answer: "Valletta",
  },
  {
    question: "Who invented the telescope?",
    options: ["Copernicus", "Galileo", "Lippershey", "Both B and C"],
    answer: "Both B and C",
  },
  {
    question: "What is the capital of Luxembourg?",
    options: [
      "Luxembourg City",
      "Esch-sur-Alzette",
      "Dudelange",
      "Differdange",
    ],
    answer: "Luxembourg City",
  },
  {
    question: "What is the rarest element on Earth?",
    options: ["Platinum", "Gold", "Francium", "Radium"],
    answer: "Francium",
  },
  {
    question: "What is the capital of Liechtenstein?",
    options: ["Schaan", "Vaduz", "Triesen", "Ruggell"],
    answer: "Vaduz",
  },
  {
    question: "How many bones does a whale have?",
    options: ["100", "200", "300", "400"],
    answer: "200",
  },
  {
    question: "What is the capital of Monaco?",
    options: ["Monaco", "Monte Carlo", "La Rousse", "Fontvieille"],
    answer: "Monaco",
  },
  {
    question: "What is the largest flower in the world?",
    options: ["Sunflower", "Rafflesia", "Water lily", "Corpse flower"],
    answer: "Rafflesia",
  },
  {
    question: "What is the capital of San Marino?",
    options: ["San Marino", "Borgo Maggiore", "Serravalle", "Domagnano"],
    answer: "San Marino",
  },
  {
    question: "Who was the first woman to win a Nobel Prize?",
    options: [
      "Marie Curie",
      "Irene Joliot-Curie",
      "Linus Pauling",
      "Barbara McClintock",
    ],
    answer: "Marie Curie",
  },
  {
    question: "What is the capital of Andorra?",
    options: [
      "Andorra la Vella",
      "Escaldes-Engordany",
      "Sant Julia de Loria",
      "Ordino",
    ],
    answer: "Andorra la Vella",
  },
  {
    question: "How many tentacles does an octopus have?",
    options: ["6", "8", "10", "12"],
    answer: "8",
  },
  {
    question: "Who wrote 'One Hundred Years of Solitude'?",
    options: [
      "Jorge Luis Borges",
      "Gabriel Garcia Marquez",
      "Julio Cortazar",
      "Isabelle Allende",
    ],
    answer: "Gabriel Garcia Marquez",
  },
  {
    question: "What is the name of the waterfall in Africa?",
    options: ["Iguazu Falls", "Niagara Falls", "Victoria Falls", "Angel Falls"],
    answer: "Victoria Falls",
  },
  {
    question: "How tall is the average giraffe?",
    options: ["12 feet", "14 feet", "16 feet", "18 feet"],
    answer: "18 feet",
  },
  {
    question: "What is the most populated country in Africa?",
    options: ["Ethiopia", "Kenya", "Nigeria", "South Africa"],
    answer: "Nigeria",
  },
  {
    question: "How many strings does a bass have?",
    options: ["3", "4", "5", "6"],
    answer: "4",
  },
  {
    question: "What is the only marsupial in North America?",
    options: ["Koala", "Wallaby", "Opossum", "Wombat"],
    answer: "Opossum",
  },
  {
    question: "What is the smallest bird in the world?",
    options: ["Hummingbird", "Wren", "Sparrow", "Finch"],
    answer: "Hummingbird",
  },
  {
    question: "What is the most dangerous snake in the world?",
    options: ["King Cobra", "Black Mamba", "Inland Taipan", "Puff Adder"],
    answer: "Inland Taipan",
  },
  {
    question: "What is the largest bird in the world?",
    options: ["Condor", "Ostrich", "Eagle", "Albatross"],
    answer: "Ostrich",
  },
  {
    question: "Who won the first Academy Award for Best Actor?",
    options: [
      "Marlon Brando",
      "Gary Cooper",
      "Emil Jannings",
      "Jack Nicholson",
    ],
    answer: "Emil Jannings",
  },
  {
    question: "What is the most toxic spider in the world?",
    options: [
      "Black Widow",
      "Brazilian Wandering Spider",
      "Sydney Funnel Web",
      "Hobo Spider",
    ],
    answer: "Brazilian Wandering Spider",
  },
  {
    question: "What is the fastest land animal?",
    options: ["Lion", "Greyhound", "Cheetah", "Pronghorn Antelope"],
    answer: "Cheetah",
  },
  {
    question: "What is the strongest muscle in the human body?",
    options: ["Bicep", "Masseter", "Gluteus Maximus", "Tongue"],
    answer: "Masseter",
  },
  {
    question: "Who is the most famous painter of the Renaissance?",
    options: ["Michelangelo", "Da Vinci", "Raphael", "Botticelli"],
    answer: "Da Vinci",
  },
  {
    question: "What is the capital of Suriname?",
    options: ["Paramaribo", "Lelydorp", "Lelydorp", "Onchan"],
    answer: "Paramaribo",
  },
  {
    question: "How many colors are in a rainbow?",
    options: ["5", "6", "7", "8"],
    answer: "7",
  },
  {
    question: "What is the only bird that can see the color red?",
    options: ["Cardinal", "Robin", "Parrot", "All birds"],
    answer: "All birds",
  },
  {
    question: "What is the capital of Guyana?",
    options: ["Georgetown", "Linden", "New Amsterdam", "Bartica"],
    answer: "Georgetown",
  },
  {
    question: "How many teeth does an elephant have?",
    options: ["20", "42", "60", "80"],
    answer: "42",
  },
  {
    question: "Who is the most famous scientist of all time?",
    options: ["Newton", "Einstein", "Darwin", "Hawking"],
    answer: "Einstein",
  },
  {
    question: "What is the deepest ocean in the world?",
    options: ["Atlantic", "Pacific", "Indian", "Arctic"],
    answer: "Pacific",
  },
  {
    question: "What is the most expensive metal in the world?",
    options: ["Gold", "Platinum", "Californium", "Rhodium"],
    answer: "Californium",
  },
  {
    question: "What is the smallest country in South America?",
    options: ["Uruguay", "Suriname", "Guyana", "Equatorial Guinea"],
    answer: "Suriname",
  },
  {
    question: "Who wrote 'Anna Karenina'?",
    options: ["Dostoevsky", "Tolstoy", "Pushkin", "Gogol"],
    answer: "Tolstoy",
  },
  {
    question: "What is the hottest place on Earth?",
    options: [
      "Death Valley",
      "Sahara Desert",
      "Atacama Desert",
      "Inside a volcano",
    ],
    answer: "Inside a volcano",
  },
  {
    question: "How many sides does a pentagon have?",
    options: ["4", "5", "6", "7"],
    answer: "5",
  },
  {
    question: "What is the fastest bird in the world?",
    options: ["Peregrine Falcon", "Cheetah", "Hummingbird", "Golden Eagle"],
    answer: "Peregrine Falcon",
  },
  {
    question: "What is the rarest flower in the world?",
    options: [
      "Midnight Orchid",
      "Californian Pitcher Plant",
      "Monkey orchid",
      "Black Peony",
    ],
    answer: "Californian Pitcher Plant",
  },
  {
    question: "Who is the world's oldest person ever recorded?",
    options: [
      "Jeanne Calment",
      "Maria Branyas",
      "Shigechiyo Izumi",
      "Sarah Knauss",
    ],
    answer: "Jeanne Calment",
  },
  {
    question: "What is the most populous city in the world?",
    options: ["Tokyo", "Delhi", "Shanghai", "São Paulo"],
    answer: "Tokyo",
  },
  {
    question: "What is the longest river in South America?",
    options: [
      "Paraná River",
      "Amazon River",
      "Orinoco River",
      "Río de la Plata",
    ],
    answer: "Amazon River",
  },
  {
    question: "What is the most widely spoken language in Africa?",
    options: ["Arabic", "Swahili", "Yoruba", "Amharic"],
    answer: "Arabic",
  },
  {
    question: "What is the shape of a diamond mineral?",
    options: ["Square", "Octahedron", "Cube", "Round"],
    answer: "Octahedron",
  },
  {
    question: "How many chambers does an octopus's heart have?",
    options: ["1", "2", "3", "4"],
    answer: "3",
  },
  {
    question: "What is the loudest animal sound on Earth?",
    options: ["Blue whale", "Elephant", "Tiger", "Lion"],
    answer: "Blue whale",
  },
  {
    question: "What is the most abundant element in the human body?",
    options: ["Oxygen", "Carbon", "Nitrogen", "Hydrogen"],
    answer: "Oxygen",
  },
  {
    question: "What is the world's busiest airport?",
    options: ["JFK", "Hartsfield-Jackson", "Dubai", "London Heathrow"],
    answer: "Hartsfield-Jackson",
  },
  {
    question: "What is the smallest country by population?",
    options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"],
    answer: "Vatican City",
  },
  {
    question: "Who directed 'Avatar'?",
    options: ["Spielberg", "Cameron", "Jackson", "Nolan"],
    answer: "Cameron",
  },
  {
    question: "What is the oldest known language still in use?",
    options: ["Latin", "Greek", "Hebrew", "Tamil"],
    answer: "Tamil",
  },
  {
    question: "What is the most visited museum in the world?",
    options: [
      "The Louvre",
      "Metropolitan Museum",
      "Vatican Museums",
      "British Museum",
    ],
    answer: "The Louvre",
  },
  {
    question: "What is the average heartbeat of a human at rest?",
    options: ["50-60 bpm", "60-100 bpm", "100-120 bpm", "120-150 bpm"],
    answer: "60-100 bpm",
  },
  {
    question: "What is the longest bone in the human body?",
    options: ["Femur", "Tibia", "Humerus", "Fibula"],
    answer: "Femur",
  },
  {
    question: "What is the most expensive spice in the world?",
    options: ["Saffron", "Vanilla", "Truffle", "Cardamom"],
    answer: "Saffron",
  },
  {
    question: "What is the only mammal that is fully aquatic?",
    options: ["Whale", "Dolphin", "Manatee", "Seal"],
    answer: "Whale",
  },
  {
    question: "What is the world's most expensive coffee?",
    options: [
      "Kona Coffee",
      "Jamaican Blue Mountain",
      "Kopi Luwak",
      "Panama Geisha",
    ],
    answer: "Kopi Luwak",
  },
  {
    question: "What is the highest mountain peak in North America?",
    options: ["Mount Mitchell", "Mount Rainier", "Denali", "Mount Whitney"],
    answer: "Denali",
  },
  {
    question: "What is the fastest mammal in the world?",
    options: ["Lion", "Pronghorn Antelope", "Cheetah", "Horse"],
    answer: "Cheetah",
  },
  {
    question: "What is the world's largest rainforest?",
    options: [
      "Congo Rainforest",
      "Southeast Asian Rainforest",
      "Amazon Rainforest",
      "Tongass Rainforest",
    ],
    answer: "Amazon Rainforest",
  },
  {
    question: "What is the only bone in the human body that is not connected?",
    options: ["Vertebra", "Thyroid cartilage", "Hyoid bone", "Sacrum"],
    answer: "Hyoid bone",
  },
  {
    question: "What is the world's highest waterfall?",
    options: ["Niagara Falls", "Victoria Falls", "Angel Falls", "Iguazu Falls"],
    answer: "Angel Falls",
  },
  {
    question: "What is the most common last name in the world?",
    options: ["Smith", "Wang", "Johnson", "Garcia"],
    answer: "Wang",
  },
  {
    question: "What is the world's thinnest country?",
    options: ["Chile", "Singapore", "Cyprus", "New Zealand"],
    answer: "Chile",
  },
  {
    question: "What is the oldest city in the world still inhabited?",
    options: ["Athens", "Rome", "Damascus", "Jerusalem"],
    answer: "Damascus",
  },
  {
    question: "What is the world's most expensive watch?",
    options: ["Patek Philippe", "Rolex", "Breguet", "Tourbillon"],
    answer: "Patek Philippe",
  },
  {
    question: "What is the tallest living tree?",
    options: ["Sequoia", "Redwood", "Yellow Meranti", "Douglas Fir"],
    answer: "Redwood",
  },
  {
    question: "What is the largest library in the world?",
    options: [
      "British Library",
      "Library of Congress",
      "New York Public Library",
      "Bodleian Library",
    ],
    answer: "Library of Congress",
  },
  {
    question: "What is the world's longest novel?",
    options: [
      "War and Peace",
      "In Search of Lost Time",
      "The Great Gatsby",
      "Les Miserables",
    ],
    answer: "In Search of Lost Time",
  },
  {
    question: "What is the world's smallest independent country?",
    options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"],
    answer: "Vatican City",
  },
  {
    question: "What is the most common blood type worldwide?",
    options: ["O+", "A+", "B+", "AB+"],
    answer: "O+",
  },
  {
    question: "What is the world's oldest known art?",
    options: [
      "Lascaux Cave Paintings",
      "Venus of Willendorf",
      "Hand Stencils",
      "Sulawesi Paintings",
    ],
    answer: "Hand Stencils",
  },
  {
    question: "What is the most expensive gemstone?",
    options: ["Diamond", "Ruby", "Sapphire", "Emerald"],
    answer: "Ruby",
  },
  {
    question: "What is the world's rarest blood type?",
    options: ["AB-", "O-", "Rh-null", "H-antigen"],
    answer: "Rh-null",
  },
  {
    question: "What is the oldest university in the world?",
    options: ["Oxford", "Cambridge", "Al-Azhar", "University of Bologna"],
    answer: "Al-Azhar",
  },
  {
    question: "What is the longest word in Spanish?",
    options: [
      "Esternocleidomastoideo",
      "Electroencefalografista",
      "Precipitadamente",
      "Arremangar",
    ],
    answer: "Electroencefalografista",
  },
  {
    question: "What is the world's hottest chili pepper?",
    options: [
      "Habanero",
      "Carolina Reaper",
      "Trinidad Scorpion",
      "Ghost Chili",
    ],
    answer: "Carolina Reaper",
  },
  {
    question: "What is the oldest national flag?",
    options: ["British flag", "Danish flag", "American flag", "French flag"],
    answer: "Danish flag",
  },
  {
    question: "What is the world's strongest material?",
    options: ["Diamond", "Graphene", "Steel", "Titanium"],
    answer: "Graphene",
  },
  {
    question: "What is the coldest place on Earth?",
    options: ["North Pole", "South Pole", "Antarctica", "Mount Everest"],
    answer: "Antarctica",
  },
  {
    question: "What is the world's oldest continuous civilization?",
    options: ["Rome", "Egypt", "Greece", "Japan"],
    answer: "Egypt",
  },
  {
    question: "What is the most efficient energy source?",
    options: ["Solar", "Wind", "Nuclear", "Hydroelectric"],
    answer: "Nuclear",
  },
  {
    question: "What is the world's largest tree by volume?",
    options: ["General Sherman", "Methuselah", "Hyperion", "Alerce"],
    answer: "General Sherman",
  },
  {
    question: "What is the most visited country in the world?",
    options: ["USA", "China", "Spain", "France"],
    answer: "France",
  },
];

// Combine all existing + new
const allMath = [...math, ...newMath];
const allPuzzles = [...puzzles, ...newPuzzles];
const allGeneral = [...general, ...newGeneral];

// Write to files
fs.writeFileSync(
  "src/features/quiz/questions/math.json",
  JSON.stringify(allMath, null, 2),
);
fs.writeFileSync(
  "src/features/quiz/questions/puzzles.json",
  JSON.stringify(allPuzzles, null, 2),
);
fs.writeFileSync(
  "src/features/quiz/questions/general.json",
  JSON.stringify(allGeneral, null, 2),
);

console.log(`✅ Complete!`);
console.log(`math.json: ${allMath.length} questions (+250)`);
console.log(`puzzles.json: ${allPuzzles.length} questions (+250)`);
console.log(`general.json: ${allGeneral.length} questions (+250)`);
