const editedTalk = (id, name, age, talk) => {
  const { watchedAt, rate } = talk;

  const obj = {
    id: Number(id),
    name,
    age,
    talk: {
        watchedAt,
        rate,
      },
  };

  return obj;
};

module.exports = {
  editedTalk,
};