// Teacher directory. Photos are imported from ./assets/teachers via Vite glob.
const photoModules = import.meta.glob("../assets/teachers/*.jpg", { eager: true, import: "default" });
const photos = {};
for (const path in photoModules) {
  const key = path.split("/").pop().replace(".jpg", ""); // t0, t1, ...
  photos[key] = photoModules[path];
}

const META = [
 {
  "name": "Tejaswi Betha",
  "role": "Grade 1 \u00b7 English",
  "joined": "2021",
  "key": "t0"
 },
 {
  "name": "Sasikala Chinnaswamy",
  "role": "Grade 1 \u00b7 Maths",
  "joined": "2024",
  "key": "t1"
 },
 {
  "name": "Krishna Sai Sree",
  "role": "Grade 2 \u00b7 English",
  "joined": "2024",
  "key": "t2"
 },
 {
  "name": "Susmita Dasgupta",
  "role": "Grade 2 \u00b7 EVS",
  "joined": "2020",
  "key": "t3"
 },
 {
  "name": "Karpagam Veerappan",
  "role": "Grade 2 Maths \u00b7 Grade 4 EVS",
  "joined": "2023",
  "key": "t4"
 },
 {
  "name": "Saraswathi Sivamani",
  "role": "Grade 3 \u00b7 English",
  "joined": "2019",
  "key": "t5"
 },
 {
  "name": "Vemula Koteswararao",
  "role": "Grade 3 \u00b7 EVS",
  "joined": "2019",
  "key": "t6"
 },
 {
  "name": "Sivasankari S",
  "role": "Grade 3 \u00b7 Maths",
  "joined": "2025",
  "key": "t7"
 },
 {
  "name": "Dr. S. Ramya",
  "role": "Grade 4 \u00b7 English",
  "joined": "2023",
  "key": "t8"
 },
 {
  "name": "Yashi Srivastava",
  "role": "Grade 4 \u00b7 Maths",
  "joined": "2025",
  "key": "t9"
 },
 {
  "name": "Divyanshi Mishra",
  "role": "Grade 5 & 6 \u00b7 English",
  "joined": "2021",
  "key": "t10"
 },
 {
  "name": "Yuthika Tejas Patel",
  "role": "Grade 5 \u00b7 Maths",
  "joined": "2020",
  "key": "t11"
 },
 {
  "name": "Sunitha Srinath",
  "role": "Grade 5 EVS \u00b7 Grade 7 English",
  "joined": "2021",
  "key": "t12"
 },
 {
  "name": "Antika Singhal",
  "role": "Grade 6 \u00b7 Maths",
  "joined": "2025",
  "key": "t13"
 },
 {
  "name": "Prajwala Devarapalli",
  "role": "Grade 6 \u00b7 Science",
  "joined": "2024",
  "key": "t14"
 },
 {
  "name": "Neetu Saini",
  "role": "Grade 7 \u00b7 Science",
  "joined": "2022",
  "key": "t15"
 },
 {
  "name": "B. Susithra",
  "role": "Grade 7 \u00b7 Science & Social",
  "joined": "2025",
  "key": "t16"
 },
 {
  "name": "Dr. Poongkavithai",
  "role": "Grade 7 Maths \u00b7 Tamil",
  "joined": "2019",
  "key": "t17"
 },
 {
  "name": "Sneha Kumari",
  "role": "Hindi",
  "joined": "2019",
  "key": "t18"
 },
 {
  "name": "Shrabani Paul",
  "role": "Classical Dance",
  "joined": "2020",
  "key": "t19"
 },
 {
  "name": "Kavya P",
  "role": "Tamil",
  "joined": "2025",
  "key": "t20"
 },
 {
  "name": "Asha S. Vishwakarma",
  "role": "Hindi",
  "joined": "2021",
  "key": "t21"
 },
 {
  "name": "Supriya Subramanyam",
  "role": "Tamil",
  "joined": "2021",
  "key": "t22"
 },
 {
  "name": "Keerthika Devi G",
  "role": "Tamil",
  "joined": "2023",
  "key": "t23"
 },
 {
  "name": "Polineni Sravanthi",
  "role": "Telugu",
  "joined": "2020",
  "key": "t24"
 },
 {
  "name": "Prathyusha Mikkili",
  "role": "Telugu",
  "joined": "2023",
  "key": "t25"
 },
 {
  "name": "Shweta Siddeshwar",
  "role": "Carnatic Music",
  "joined": "2024",
  "key": "t26"
 },
 {
  "name": "Shalini Gupta",
  "role": "Drawing",
  "joined": "2020",
  "key": "t27"
 }
];

export const TEACHERS = META.map((t) => ({ ...t, photo: photos[t.key] }));
