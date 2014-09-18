/*
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

Ext.define('Arches.factories.Report',{
	singleton: true,

	create: function(entitytypeid, options){
		var report = 'Arches.reports.Default';
		var options = options || {};
		Ext.each(Arches.i18n.DomainData.EntityTypes, function(entitytype, index, allentitytypes){
            if(entitytype.entitytypeid === entitytypeid){
                // report = entitytype.reportwidget || report;
                report = 'Arches.reports.Monument';

                // example of how to override the template for the default report
                //options = this.overrideTemplate(entitytype, options);
                return false;
            }
        }, this);
        return Ext.create(report,options);
	},

	overrideTemplate: function(entitytype, options){
		var template = '';
		if (entitytype.entitytypename === "Church"){
			template = Arches.config.Tpls.alternatereport;
        }
        if(template !== ''){
			options.tpl = template;
        }
		return options;
	}
});