import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'changelog',
  title: 'Changelog',
  type: 'document',
  icon: () => '📝',
  fields: [
    defineField({
      name: 'version',
      title: 'Version',
      type: 'string',
      description: 'Version number (e.g., 1.0.0, 2.1.3)',
      validation: (rule) => rule.required().max(20),
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release Date',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Release Title',
      type: 'string',
      description: 'Optional title for this release (e.g., "Major Update", "Bug Fixes")',
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: 'description',
      title: 'Release Description',
      type: 'text',
      rows: 3,
      description: 'Brief overview of this release',
    }),
    defineField({
      name: 'changes',
      title: 'Changes',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'changeItem',
          title: 'Change Item',
          fields: [
            {
              name: 'type',
              title: 'Change Type',
              type: 'string',
              options: {
                list: [
                  { title: 'New Feature', value: 'feature' },
                  { title: 'Improvement', value: 'improvement' },
                  { title: 'Bug Fix', value: 'bugfix' },
                  { title: 'Security Fix', value: 'security' },
                  { title: 'Breaking Change', value: 'breaking' },
                  { title: 'Deprecation', value: 'deprecation' },
                ],
                layout: 'radio',
              },
              validation: (rule) => rule.required(),
            },
            {
              name: 'title',
              title: 'Change Title',
              type: 'string',
              validation: (rule) => rule.required().max(200),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Detailed description of the change',
            },
            {
              name: 'impact',
              title: 'Impact Level',
              type: 'string',
              options: {
                list: [
                  { title: 'High', value: 'high' },
                  { title: 'Medium', value: 'medium' },
                  { title: 'Low', value: 'low' },
                ],
                layout: 'radio',
              },
            },
            {
              name: 'affectedAreas',
              title: 'Affected Areas',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                layout: 'tags',
              },
              description: 'Areas of the app affected by this change',
            },
          ],
          preview: {
            select: {
              title: 'title',
              type: 'type',
            },
            prepare(selection) {
              const { title, type } = selection
              const typeLabels = {
                feature: '✨',
                improvement: '⚡',
                bugfix: '🐛',
                security: '🔒',
                breaking: '💥',
                deprecation: '⚠️',
              }
              return {
                title,
                subtitle: `${typeLabels[type as keyof typeof typeLabels] || '📝'} ${type}`,
              }
            },
          },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'migrationNotes',
      title: 'Migration Notes',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Code', value: 'code' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Code', value: 'code' },
            ],
          },
        },
      ],
      description: 'Important notes for developers or users about migrating to this version',
    }),
    defineField({
      name: 'downloadLinks',
      title: 'Download Links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'downloadLink',
          title: 'Download Link',
          fields: [
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  { title: 'iOS', value: 'ios' },
                  { title: 'Android', value: 'android' },
                  { title: 'Web', value: 'web' },
                  { title: 'Desktop', value: 'desktop' },
                  { title: 'API', value: 'api' },
                ],
              },
              validation: (rule) => rule.required(),
            },
            {
              name: 'url',
              title: 'Download URL',
              type: 'url',
              validation: (rule) => rule.required(),
            },
            {
              name: 'size',
              title: 'File Size',
              type: 'string',
              description: 'e.g., "25.4 MB", "1.2 GB"',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Whether this changelog entry is published and visible to users',
      initialValue: false,
    }),
    defineField({
      name: 'featured',
      title: 'Featured Release',
      type: 'boolean',
      description: 'Highlight this release as a major update',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      version: 'version',
      title: 'title',
      releaseDate: 'releaseDate',
      published: 'published',
    },
    prepare(selection) {
      const { version, title, releaseDate, published } = selection
      const status = published ? '✅' : '⏳'
      return {
        title: title ? `${version} - ${title}` : version,
        subtitle: `${status} ${releaseDate}`,
      }
    },
  },
  orderings: [
    {
      title: 'Release Date, New',
      name: 'releaseDateDesc',
      by: [{ field: 'releaseDate', direction: 'desc' }],
    },
    {
      title: 'Release Date, Old',
      name: 'releaseDateAsc',
      by: [{ field: 'releaseDate', direction: 'asc' }],
    },
    {
      title: 'Version, New',
      name: 'versionDesc',
      by: [{ field: 'version', direction: 'desc' }],
    },
  ],
})
