import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'roadmap',
  title: 'Roadmap',
  type: 'document',
  icon: () => '🗺️',
  fields: [
    defineField({
      name: 'title',
      title: 'Feature Title',
      type: 'string',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) => input
          .toLowerCase()
          .replace(/\s+/g, '-')
          .slice(0, 96)
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Detailed description of the feature or improvement',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Planned', value: 'planned' },
          { title: 'In Progress', value: 'in-progress' },
          { title: 'In Review', value: 'in-review' },
          { title: 'Testing', value: 'testing' },
          { title: 'Completed', value: 'completed' },
          { title: 'On Hold', value: 'on-hold' },
          { title: 'Cancelled', value: 'cancelled' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'string',
      options: {
        list: [
          { title: 'Critical', value: 'critical' },
          { title: 'High', value: 'high' },
          { title: 'Medium', value: 'medium' },
          { title: 'Low', value: 'low' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'New Feature', value: 'feature' },
          { title: 'Enhancement', value: 'enhancement' },
          { title: 'Bug Fix', value: 'bugfix' },
          { title: 'Performance', value: 'performance' },
          { title: 'Security', value: 'security' },
          { title: 'UI/UX', value: 'ui-ux' },
          { title: 'API', value: 'api' },
          { title: 'Infrastructure', value: 'infrastructure' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'timeline',
      title: 'Timeline',
      type: 'object',
      fields: [
        {
          name: 'startDate',
          title: 'Start Date',
          type: 'date',
          description: 'When development is expected to begin',
        },
        {
          name: 'targetDate',
          title: 'Target Completion Date',
          type: 'date',
          description: 'Expected completion date',
        },
        {
          name: 'actualDate',
          title: 'Actual Completion Date',
          type: 'date',
          description: 'Actual completion date (if completed)',
        },
        {
          name: 'quarter',
          title: 'Target Quarter',
          type: 'string',
          options: {
            list: [
              { title: 'Q1 2024', value: 'q1-2024' },
              { title: 'Q2 2024', value: 'q2-2024' },
              { title: 'Q3 2024', value: 'q3-2024' },
              { title: 'Q4 2024', value: 'q4-2024' },
              { title: 'Q1 2025', value: 'q1-2025' },
              { title: 'Q2 2025', value: 'q2-2025' },
              { title: 'Q3 2025', value: 'q3-2025' },
              { title: 'Q4 2025', value: 'q4-2025' },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'progress',
      title: 'Progress',
      type: 'number',
      validation: (rule) => rule.min(0).max(100),
      description: 'Completion percentage (0-100)',
    }),
    defineField({
      name: 'assignee',
      title: 'Assignee',
      type: 'string',
      description: 'Person or team responsible for this feature',
    }),
    defineField({
      name: 'dependencies',
      title: 'Dependencies',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'roadmap' }],
        },
      ],
      description: 'Other roadmap items this feature depends on',
    }),
    defineField({
      name: 'acceptanceCriteria',
      title: 'Acceptance Criteria',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'criteria',
          title: 'Criteria',
          fields: [
            {
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: (rule) => rule.required(),
            },
            {
              name: 'completed',
              title: 'Completed',
              type: 'boolean',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              title: 'description',
              completed: 'completed',
            },
            prepare(selection) {
              const { title, completed } = selection
              return {
                title,
                subtitle: completed ? '✅ Completed' : '⏳ Pending',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'userStories',
      title: 'User Stories',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'userStory',
          title: 'User Story',
          fields: [
            {
              name: 'story',
              title: 'Story',
              type: 'text',
              rows: 2,
              validation: (rule) => rule.required(),
            },
            {
              name: 'priority',
              title: 'Priority',
              type: 'string',
              options: {
                list: [
                  { title: 'Must Have', value: 'must-have' },
                  { title: 'Should Have', value: 'should-have' },
                  { title: 'Could Have', value: 'could-have' },
                  { title: 'Won\'t Have', value: 'wont-have' },
                ],
              },
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'technicalNotes',
      title: 'Technical Notes',
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
      description: 'Technical implementation notes and considerations',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'Tags to help categorize and filter roadmap items',
    }),
    defineField({
      name: 'public',
      title: 'Public',
      type: 'boolean',
      description: 'Whether this roadmap item should be visible to users',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Highlight this as a key feature',
      initialValue: false,
    }),
    defineField({
      name: 'estimatedEffort',
      title: 'Estimated Effort',
      type: 'string',
      options: {
        list: [
          { title: 'XS (1-2 days)', value: 'xs' },
          { title: 'S (3-5 days)', value: 's' },
          { title: 'M (1-2 weeks)', value: 'm' },
          { title: 'L (2-4 weeks)', value: 'l' },
          { title: 'XL (1-2 months)', value: 'xl' },
          { title: 'XXL (2+ months)', value: 'xxl' },
        ],
      },
      description: 'Estimated development effort using t-shirt sizing',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      priority: 'priority',
      progress: 'progress',
      category: 'category',
    },
    prepare(selection) {
      const { title, status, priority, progress, category } = selection
      const statusEmojis = {
        planned: '📋',
        'in-progress': '🚧',
        'in-review': '👀',
        testing: '🧪',
        completed: '✅',
        'on-hold': '⏸️',
        cancelled: '❌',
      }
      const priorityColors = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }
      return {
        title,
        subtitle: `${statusEmojis[status as keyof typeof statusEmojis] || '📝'} ${status} • ${priorityColors[priority as keyof typeof priorityColors] || '⚪'} ${priority} • ${progress || 0}% • ${category}`,
      }
    },
  },
  orderings: [
    {
      title: 'Priority, High to Low',
      name: 'priorityDesc',
      by: [
        { field: 'priority', direction: 'desc' },
        { field: 'title', direction: 'asc' },
      ],
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [
        { field: 'status', direction: 'asc' },
        { field: 'priority', direction: 'desc' },
      ],
    },
    {
      title: 'Target Date',
      name: 'targetDateAsc',
      by: [{ field: 'timeline.targetDate', direction: 'asc' }],
    },
    {
      title: 'Progress, High to Low',
      name: 'progressDesc',
      by: [{ field: 'progress', direction: 'desc' }],
    },
  ],
})
