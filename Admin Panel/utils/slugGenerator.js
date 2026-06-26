const slugify = require('slugify');

const generateSlug = async (Model, name, excludeId = null) => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Model.findOne(query);
    if (!exists) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = generateSlug;
