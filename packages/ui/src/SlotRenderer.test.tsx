import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SlotDefinition, SlotType } from '@slideforge/schema';
import { SlotRenderer } from './SlotRenderer';

function slot(type: SlotType, overrides: Partial<SlotDefinition> = {}): SlotDefinition {
  return {
    id: `${type}-slot`,
    type,
    required: false,
    position: { x: '0%', y: '0%', w: '100%', h: '100%' },
    ...overrides,
  };
}

function render(slotDefinition: SlotDefinition, content?: string | string[]) {
  return renderToStaticMarkup(<SlotRenderer slot={slotDefinition} content={content} />);
}

describe('SlotRenderer', () => {
  it('renders heading and subheading text slots', () => {
    expect(render(slot('heading'), 'Quarterly Results')).toContain('<h2');
    expect(render(slot('heading'), 'Quarterly Results')).toContain('Quarterly Results');
    expect(render(slot('subheading'), 'North America')).toContain('North America');
  });

  it('renders body text and applies overlay text styling when requested', () => {
    const html = renderToStaticMarkup(
      <SlotRenderer slot={slot('body')} content="Revenue grew steadily." hasBackgroundImage />,
    );

    expect(html).toContain('<p');
    expect(html).toContain('Revenue grew steadily.');
    expect(html).toContain('text-shadow');
  });

  it('renders list content from arrays and newline-delimited strings', () => {
    const arrayHtml = render(slot('list'), ['Plan', 'Build', 'Launch']);
    const textHtml = render(slot('list'), 'One\nTwo\n\nThree');

    expect(arrayHtml).toContain('<li>Plan</li>');
    expect(arrayHtml).toContain('<li>Launch</li>');
    expect(textHtml).toContain('<li>One</li>');
    expect(textHtml).toContain('<li>Three</li>');
  });

  it('renders empty list placeholders', () => {
    expect(render(slot('list'))).toContain('Add bullet points');
  });

  it('renders image URLs and placeholders for non-url image content', () => {
    const imageHtml = render(slot('image'), 'https://example.com/slide.png');
    const placeholderHtml = render(slot('image'), 'generate a mountain image');

    expect(imageHtml).toContain('<img');
    expect(imageHtml).toContain('src="https://example.com/slide.png"');
    expect(placeholderHtml).toContain('Image generating');
  });

  it('renders quote, icon, and divider slots', () => {
    expect(render(slot('quote'), 'Make it memorable.')).toContain('<blockquote');
    expect(render(slot('quote'), 'Make it memorable.')).toContain('Make it memorable.');
    expect(render(slot('icon'), 'check')).toContain('check');
    expect(render(slot('divider'))).toContain('<hr');
  });

  it('renders chart bars and labels from JSON data', () => {
    const html = render(slot('chart'), JSON.stringify({ labels: ['Q1', 'Q2'], values: [10, 20] }));

    expect(html).toContain('Q1');
    expect(html).toContain('Q2');
    expect(html).not.toContain('Chart data loading');
  });

  it('shows the chart placeholder for invalid or empty chart data', () => {
    expect(render(slot('chart'), '{bad json')).toContain('Chart data loading');
    expect(render(slot('chart'), JSON.stringify({ labels: ['Q1'], values: ['oops'] }))).toContain(
      'Chart data loading',
    );
  });
});
