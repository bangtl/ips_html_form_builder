{
    'name': "HTML Form Builder Odoo13",
    'version': "1.0.0",
    'author': "IctPack Solutions LTD, Sythil Tech",
    'category': "Website",
    'summary': "Manage both internal and external forms",
    'description': "Manage both internal and external forms",
    'license':'LGPL-3',
    'data': [
        'views/html_form.xml',
        'views/snippets.xml',
        'views/html_form_action_views.xml',
        'views/website_templates.xml',
        'views/email_templates.xml',
        'data/html.form.captcha.csv',
        'data/html.form.field.type.csv',
        'data/html.form.action.type.csv',
        'data/html.form.snippet.action.csv',
        'security/ir.model.access.csv',
    ],
    'demo': [],
    'images':[
        'static/description/1.jpg',
    ],
    'depends': ['website'],
    'installable': True,
    'images': [
        'static/description/banner.png'
    ],
}
