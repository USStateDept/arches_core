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

Ext.namespace('Arches.config');
Arches.config.Tpls = {
    searchItem: '<div style="height:47px;">' +
        '<div style="width: 40px;float:left;">' +
            '<div class="legend-icon-wrap"><img src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{[this.getPropertyValueFromEntityTypeId(this.getEntityTypeId(values), "icon")]}.png"></img></div>' +
        '</div>' +
        '<div style="white-space:nowrap;overflow-x:hidden;">' +
            '<div style="font-size: 14px; line-height: 18px; color: #2B32D6;">{[Ext.String.ellipsis(this.getNameFromSearchResult(values), 36, false)]}</div>'+
            '<div style="font-size: 11px;line-height: 14px;">{[this.getEntityTypeNameFromId(this.getEntityTypeId(values))]}</div>' +
            '<div style="font-size: 11px;line-height: 14px;" class="entity-tools">' +
                '<tpl if="geometries.length &gt; 0"><a href="#" class="zoom-to-entity">Zoom<a> | </tpl>' +
                '<tpl if="geometry"><a href="#" class="zoom-to-entity">Zoom<a> | </tpl>' +
                '<tpl if="this.isUserLoggedin()"><a href="#" class="edit-entity">Edit<a> | </tpl>' +
                '<a href="#" class="view-report">Report<a>' +
            '</div>'+
        '</div></div>',
    clusterList: '<div style="height:32px;">' +
        '<div style="white-space:nowrap;overflow-x:hidden;">' +
            '<div style="font-size: 14px; line-height: 18px; color: #2B32D6;">{primaryname}</div>'+
            '<div style="font-size: 11px;line-height: 14px;" class="entity-tools">' +
                '<tpl if="geometry !== \'\'"><a href="#" class="zoom-to-entity">Zoom<a> | </tpl>' +
                '<tpl if="this.isUserLoggedin()"><a href="#" class="edit-entity">Edit<a> | </tpl>' +
                '<a href="#" class="view-report">Report<a>' +
            '</div>'+
        '</div></div>',
    clusterPopup: '<div style="height:47px;">' +
        '<div style="width: 40px;float:left;">' +
            '<div class="legend-icon-wrap"><img src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{icon}.png"></img></div>' +
        '</div>' +
        '<div style="white-space:nowrap;overflow-x:hidden;">' +
            '<div style="font-size: 14px; line-height: 18px; color: #2B32D6;">{count} Resources</div>'+
            '<div style="font-size: 11px;line-height: 14px;">{layerName}</div>' +
            '<div style="font-size: 11px;line-height: 14px;" class="entity-tools">' +
                '<a href="#" class="list-features">List Resources<a>' +
            '</div>'+
        '</div></div>',
    clusterListHeader: '<div style="height:47px;">' +
        '<div style="width: 40px;float:left;">' +
            '<div class="legend-icon-wrap"><img src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{icon}.png"></img></div>' +
        '</div>' +
        '<div style="white-space:nowrap;overflow-x:hidden;">' +
            '<div style="font-size: 14px; line-height: 18px; color: #2B32D6;">{count} Resources</div>'+
            '<div style="font-size: 11px;line-height: 14px;">{layerName}</div>' +
        '</div></div>',
    hoverPopup: '<div style="text-align:center;">{[Ext.String.ellipsis(values.attributes.primaryname, 20, false)]}</div>',
    searchResults: '<div style="height:47px;">' +
        '<div style="width: 40px;float:left;">' +
            '<div class="legend-icon-wrap"><img src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{[this.getPropertyValueFromEntityTypeId(this.getEntityTypeId(values), "icon")]}.png"></img></div>' +
        '</div>' +
        '<div style="white-space:nowrap;overflow-x:hidden;">' +
            '<div style="font-size: 14px; line-height: 18px; color: #2B32D6;">{[Ext.String.ellipsis(this.getNameFromSearchResult(values), 43, false)]}</div>'+
            '<div style="font-size: 11px;line-height: 14px;">{[this.getEntityTypeNameFromId(this.getEntityTypeId(values))]}</div>' +
            '<div style="font-size: 11px;line-height: 14px;" class="entity-tools">' +
                '<tpl if="geometries.length &gt; 0"><a href="#" class="zoom-to-entity">Zoom<a> | </tpl>' +
                '<tpl if="geometry"><a href="#" class="zoom-to-entity">Zoom<a> | </tpl>' +
                '<tpl if="this.isUserLoggedin()"><a href="#" class="edit-entity">Edit<a> | </tpl>' +
                '<a href="#" class="view-report">Report<a>' +
            '</div>'+
        '</div></div>',
    alternatereport: '<div class="report">' +
        '<div>My alternate report content goes here....</div>' +
    '</div>',
    appData: { user: null },
    functions:{
        getEntityTypeId: function (values) {
            var id;
            if (values.entityTypeId) {
                id = values.entityTypeId;
            } else if (values.entitytypeid) {
                id = values.entitytypeid;
            }
            return id;
        },
        getEntityTypeNameFromId: function(entityTypeId){
            var name = "";
            Ext.each(Arches.i18n.DomainData.EntityTypes, function(item, index, allItems){
                if (item.entitytypeid === entityTypeId){
                    name = item.entitytypename;
                    return true;
                }
            });
            return name;
        },
        getPropertyValueFromEntityTypeId: function(entityTypeId, property){
            var value;
            Ext.each(Arches.i18n.DomainData.EntityTypes, function(item, index, allItems){
                if (item.entitytypeid === entityTypeId){
                    value = item[property];
                    return true;
                }
            });
            if(!value) {
                value = 'unknown';
            }
            return value;
        },
        getNameFromSearchResult: function (values) {
            return values.primaryname;
        },
        isUserLoggedin: function () {
            //changing this to is_staff and logged
            loggedIn = false;
            if (Arches.config.Tpls.appData.user && Arches.config.Tpls.appData.user.is_active) {
                loggedIn = true;
            }
            return loggedIn;
        }
    }
};