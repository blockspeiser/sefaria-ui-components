import type { GalleryConfig } from '../../types/gallery';
import { CalendarBlock, type CalendarBlockProps } from './CalendarBlock';

const sourceCode = `import { CalendarBlock } from '@sefaria/ui-components';

export function Example() {
  return <CalendarBlock calendar="Parashat Hashavua" />;
}`;

const calendarExamples: Array<{ title: string; calendar: string; description?: string }> = [
  { title: 'Parashat Hashavua', calendar: 'Parashat Hashavua' },
  { title: 'Daf Yomi', calendar: 'Daf Yomi' },
  { title: '929', calendar: '929' },
  { title: 'Daily Mishnah', calendar: 'Daily Mishnah' },
  { title: 'Daily Rambam', calendar: 'Daily Rambam' },
  { title: 'Daily Rambam (3 Chapters)', calendar: 'Daily Rambam (3 Chapters)' },
  { title: 'Daf a Week', calendar: 'Daf a Week' },
  { title: 'Halakhah Yomit', calendar: 'Halakhah Yomit' },
  { title: 'Arukh HaShulchan Yomi', calendar: 'Arukh HaShulchan Yomi' },
  { title: 'Tanakh Yomi', calendar: 'Tanakh Yomi' },
  { title: 'Chok LeYisrael', calendar: 'Chok LeYisrael' },
  { title: 'Tanya Yomi', calendar: 'Tanya Yomi' },
  { title: 'Yerushalmi Yomi', calendar: 'Yerushalmi Yomi' },
  { title: 'Haftarah', calendar: 'Haftarah' },
  {
    title: 'Haftarah (Alternate)',
    calendar: 'Haftarah',
    description: 'The calendar API can return multiple Haftarah items on the same date.',
  },
];

export const calendarBlockGallery: GalleryConfig<CalendarBlockProps> = {
  name: 'CalendarBlock',
  description:
    'Displays today\'s calendar data for any learning calendarfrom the Sefaria calendars API, like Parashat Hashavua, Daf Yomi, and more.',
  shortDescription: 'Styled blocks for learning calendars like Parashat Hashavua, Haftarah, Daf Yomi, and more.',
  component: CalendarBlock,
  sourceCode,
  propsList: ['calendar', 'showText', 'className', 'style'],
  overviewExample: {
    calendar: 'Parashat Hashavua',
  },
  examples: calendarExamples.map((example) => ({
    title: example.title,
    description: example.description,
    props: {
      calendar: example.calendar,
      showText: false,
    },
  })),
};

export default calendarBlockGallery;
