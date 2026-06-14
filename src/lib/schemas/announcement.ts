import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'announcement',
  title: 'Announcement Banner',
  type: 'document',
  icon: () => '📢',
  fields: [
    defineField({
      name: 'title',
      title: 'Announcement Title',
      type: 'string',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 3,
      description: 'Main announcement message to display',
      validation: (rule) => rule.required().max(500),
    }),
    defineField({
      name: 'type',
      title: 'Announcement Type',
      type: 'string',
      options: {
        list: [
          { title: 'Info', value: 'info' },
          { title: 'Success', value: 'success' },
          { title: 'Warning', value: 'warning' },
          { title: 'Error', value: 'error' },
          { title: 'New Feature', value: 'feature' },
          { title: 'Maintenance', value: 'maintenance' },
          { title: 'Promotion', value: 'promotion' },
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
          { title: 'Low', value: 'low' },
          { title: 'Medium', value: 'medium' },
          { title: 'High', value: 'high' },
          { title: 'Critical', value: 'critical' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'actionButton',
      title: 'Action Button',
      type: 'object',
      fields: [
        {
          name: 'text',
          title: 'Button Text',
          type: 'string',
          validation: (rule) => rule.max(50),
        },
        {
          name: 'url',
          title: 'Button URL',
          type: 'url',
        },
        {
          name: 'openInNewTab',
          title: 'Open in New Tab',
          type: 'boolean',
          initialValue: false,
        },
      ],
    }),
    defineField({
      name: 'dismissible',
      title: 'Dismissible',
      type: 'boolean',
      description: 'Allow users to dismiss this announcement',
      initialValue: true,
    }),
    defineField({
      name: 'showOnPages',
      title: 'Show On Pages',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Home', value: 'home' },
          { title: 'All Pages', value: 'all' },
          { title: 'Changelog', value: 'changelog' },
          { title: 'Roadmap', value: 'roadmap' },
          { title: 'Guides', value: 'guides' },
          { title: 'Quizzes', value: 'quizzes' },
          { title: 'Resources', value: 'resources' },
        ],
        layout: 'tags',
      },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'When to start showing this announcement',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'When to stop showing this announcement (optional)',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this announcement is currently active',
      initialValue: true,
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      options: {
        list: [
          { title: 'Blue', value: 'blue' },
          { title: 'Green', value: 'green' },
          { title: 'Yellow', value: 'yellow' },
          { title: 'Red', value: 'red' },
          { title: 'Purple', value: 'purple' },
          { title: 'Gray', value: 'gray' },
        ],
        layout: 'radio',
      },
      initialValue: 'blue',
    }),
    defineField({
      name: 'customCSS',
      title: 'Custom CSS',
      type: 'text',
      rows: 3,
      description: 'Custom CSS classes or styles (optional)',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      priority: 'priority',
      active: 'active',
      startDate: 'startDate',
    },
    prepare(selection) {
      const { title, type, priority, active, startDate } = selection
      const typeEmojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        feature: '✨',
        maintenance: '🔧',
        promotion: '🎉',
      }
      const priorityColors = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴',
      }
      const status = active ? '🟢 Active' : '🔴 Inactive'
      return {
        title,
        subtitle: `${typeEmojis[type as keyof typeof typeEmojis] || '📢'} ${type} • ${priorityColors[priority as keyof typeof priorityColors] || '⚪'} ${priority} • ${status} • ${startDate ? new Date(startDate).toLocaleDateString() : 'No date'}`,
      }
    },
  },
  orderings: [
    {
      title: 'Priority, High to Low',
      name: 'priorityDesc',
      by: [
        { field: 'priority', direction: 'desc' },
        { field: 'startDate', direction: 'desc' },
      ],
    },
    {
      title: 'Start Date, New',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
    {
      title: 'Active First',
      name: 'activeFirst',
      by: [
        { field: 'active', direction: 'desc' },
        { field: 'priority', direction: 'desc' },
      ],
    },
  ],
})
