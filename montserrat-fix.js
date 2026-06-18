const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap`,
  `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Montserrat:wght@700;800;900&display=swap`
);

fs.writeFileSync('index.html', c);
console.log('Done');
