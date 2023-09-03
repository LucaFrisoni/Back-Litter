const User = require("../../Database/Models/User");
const {
  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  addDays,
} = require("date-fns");

const getCharts = async (req, res) => {
  const { userId, month, mode, year } = req.query;
  const currentDate = new Date();
  const currentMonth = currentDate.getUTCMonth();
  const currentYear = currentDate.getUTCFullYear();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  try {
    const user = await User.findById(userId).populate("posts");

    // Verificar si el mes seleccionado es posterior al mes actual
    const monthIndex = monthNames.findIndex((name) => name === month);
    if (monthIndex === -1) {
      return res.status(400).json({ error: "Mes no válido" });
    }

    if (year == currentYear && monthIndex > currentMonth) {
      return res
        .status(400)
        .json("You cannot select a month that has not happened yet");
    }

    // Calcular el rango de fechas para el mes seleccionado
    let startOfMonthDate = startOfMonth(new Date(year, monthIndex, 1));

    let endOfMonthDate = new Date(year, monthIndex + 1, 1);
    if (year == currentYear && monthIndex === currentMonth) {
      endOfMonthDate = currentDate;
    }

    const filteredLikes = user.posts.reduce((likes, post) => {
      likes.push(
        ...post.likeIds.filter((like) => {
          const likeDate = new Date(like.timestamp);

          return likeDate >= startOfMonthDate && likeDate <= endOfMonthDate;
        })
      );
      return likes;
    }, []);

    // console.log("Start", startOfMonthDate);
    // console.log("End", endOfMonthDate);
    // console.log("Likes Filtrados =>", filteredLikes);

    let labels = [];
    const values = [];

    if (mode === "day") {
      startOfMonthDate = startOfMonth(new Date(year, monthIndex, 2));
      let endOfMonthDate = new Date(year, monthIndex + 1, 0);
      if (year == currentYear && monthIndex === currentMonth) {
        endOfMonthDate = currentDate;
      }
      const daysInMonth = eachDayOfInterval({
        start: startOfMonthDate,
        end: endOfMonthDate,
      });

      for (const day of daysInMonth) {
        const dayLikes = filteredLikes.filter((like) => {
          const likeDate = new Date(like.timestamp);
          return likeDate.toDateString() === day.toDateString();
        }).length;
        labels.push(format(day, "dd-MM"));
        values.push(dayLikes);
      }
    } else if (mode === "week") {
      let endOfMonthDate = new Date(year, monthIndex + 1, 0);

      let ranges = [
        { start: 1, end: 7 },
        { start: 8, end: 14 },
        { start: 15, end: 21 },
        { start: 22, end: 28 },
        { start: 29, end: endOfMonthDate.getUTCDate() }, // Asegúrate de no exceder el último día del mes
      ];
      if (monthIndex === 1) {
        ranges = [
          { start: 1, end: 7 },
          { start: 8, end: 14 },
          { start: 15, end: 21 },
          { start: 22, end: 28 },
        ];
      }
      if (year == currentYear && monthIndex === currentMonth) {
        endOfMonthDate = currentDate;

        if (currentDate.getUTCDate() <= 7) {
          ranges = [{ start: 1, end: currentDate.getUTCDate() }];
        }
        if (currentDate.getUTCDate() <= 14 && currentDate.getUTCDate() > 7) {
          ranges = [
            { start: 1, end: currentDate.getUTCDate() },
            { start: 8, end: 14 },
          ];
        }
        if (currentDate.getUTCDate() <= 21 && currentDate.getUTCDate() > 14) {
          ranges = [
            { start: 1, end: currentDate.getUTCDate() },
            { start: 8, end: 14 },
            { start: 15, end: 21 },
          ];
        }
        if (currentDate.getUTCDate() <= 28 && currentDate.getUTCDate() > 21) {
          ranges = [
            { start: 1, end: currentDate.getUTCDate() },
            { start: 8, end: 14 },
            { start: 15, end: 21 },
            { start: 22, end: 28 },
          ];
        }
        if (currentDate.getUTCDate() <= 31 && currentDate.getUTCDate() > 28) {
          ranges = [
            { start: 1, end: currentDate.getUTCDate() },
            { start: 8, end: 14 },
            { start: 15, end: 21 },
            { start: 22, end: 28 },
            { start: 29, end: endOfMonthDate.getUTCDate() }, // Asegúrate de no exced
          ];
        }
      }

      // Inicializa un arreglo para almacenar las fechas de inicio y fin de cada semana
      const weeksInMonth = [];

      // Inicializa un arreglo para almacenar la cantidad de "likes" por semana

      // Para cada rango, calcula las fechas de inicio y fin y agrégalas al arreglo
      for (const range of ranges) {
        const startDay = range.start;
        const endDay = range.end; // Asegúrate de no exceder el último día del mes
        const startOfWeek = addDays(startOfMonthDate, startDay - 1);
        const endOfWeek = addDays(startOfMonthDate, endDay - 1);
        // console.log("startDay", startDay);
        // console.log("endDay", endDay);
        // console.log("startOfWeek", startOfWeek);
        // console.log("endOfWeek", endOfWeek);
        weeksInMonth.push({ start: startOfWeek, end: endOfWeek });
      }

      // Para cada semana, calcula la cantidad de "likes" en función de las fechas
      for (const week of weeksInMonth) {
        const weekStart = new Date(week.start);
        const weekEnd = new Date(week.end);
        const weekLikes = filteredLikes.filter((like) => {
          const likeDate = new Date(like.timestamp);
          console.log("LikeDate =>", likeDate.toDateString());
          console.log("week start =>", weekStart);
          console.log("week end =>", weekEnd);
          return likeDate >= weekStart && likeDate <= weekEnd;
        }).length;
        values.push(weekLikes);
        labels = [
          `01 - ${monthIndex + 1}  / 07 - ${monthIndex + 1} `,
          `08 - ${monthIndex + 1}  / 14 - ${monthIndex + 1} `,
          `15 - ${monthIndex + 1}  / 21 - ${monthIndex + 1} `,
          `22 - ${monthIndex + 1}  / 28 - ${monthIndex + 1} `,
          `29 - ${monthIndex + 1}  / 30 - ${monthIndex + 1} `,
        ];
        if ([0, 2, 4, 6, 7, 9, 11].includes(monthIndex)) {
          labels = [
            `01 - ${monthIndex + 1}  / 07 - ${monthIndex + 1} `,
            `08 - ${monthIndex + 1}  / 14 - ${monthIndex + 1} `,
            `15 - ${monthIndex + 1}  / 21 - ${monthIndex + 1} `,
            `22 - ${monthIndex + 1}  / 28 - ${monthIndex + 1} `,
            `29 - ${monthIndex + 1}  / 31 - ${monthIndex + 1} `,
          ];
        }
        if (monthIndex === 1) {
          labels = [
            ` 01 - 02  / 07 - 02 `,
            `08 - 02  / 14 - 02 `,
            `15 - 02  / 21 - 02 `,
            `22 - 02  / 28 - 02 `,
          ];
        }
        if (monthIndex === 8 && year == currentYear) {
          labels = labels[ranges.length - 1];
        }
      }
    }

    return res.status(200).json({ labels, values });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

module.exports = { getCharts };
