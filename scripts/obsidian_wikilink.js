'use strict';

hexo.extend.filter.register('before_post_render', function(data) {
  if (!data.content) return data;

  // ![[image.heic]] -> ![image](/images/image.jpg)
  data.content = data.content.replace(
    /!\[\[([^\]]+)\.(heic|HEIC)\]\]/g,
    '![$1](/images/$1.jpg)'
  );

  // ![[image.png/jpg/jpeg/gif/webp]] -> ![image.ext](/images/image.ext)
  data.content = data.content.replace(
    /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp))\]\]/gi,
    '![$1](/images/$1)'
  );

  // Derive the category folder from source (e.g. _posts/Music/Music-Chords.md -> /Music/)
  const sourceParts = (data.source || '').replace(/^_posts\//, '').split('/');
  const folder = sourceParts.length > 1 ? '/' + sourceParts.slice(0, -1).join('/') + '/' : '/';

  // [[PageName|Label]] -> [Label](/Category/PageName/)
  data.content = data.content.replace(
    /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
    (_, page, label) => `[${label}](${folder}${page}/)`
  );

  // [[PageName]] -> [PageName](/Category/PageName/)
  data.content = data.content.replace(
    /\[\[([^\]|]+)\]\]/g,
    (_, page) => `[${page}](${folder}${page}/)`
  );

  return data;
});
