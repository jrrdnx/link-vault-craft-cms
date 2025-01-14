
// An index of added filters. We'll never subtract from it (to avoid index collisions).
var filterCount = $(".filterField").length;

// On page load, toggle appropriate field readonly/disable
$(".filterField").each(function() {
    var index = $(this).attr("data-idx");
    toggleValueFieldReadonly(index);
});

// JS
$("body").on("change", "#groupId", function() {
    // If entry type changes, remove all current filters.
    $(".filterFields").html('');
    $("#reportsForm").submit();
});

// Add another filter by cloning this filter, emptying values and updating its numeric index.
$(".filterFields").on("mouseup touchup", "[data-add-filter]", function() {
    // Increment the global filter counter.
    filterCount ++;
    var currentFilter = $(this).parent();
    var newFilter = currentFilter.clone();
    // Increment the index values in the field attributes.
    $(newFilter).find("input[type='text'], input[type='number'], select, textarea").each(function() {
        var newName = $(this).attr("name").replace(/(\d+)/g, filterCount);
        $(this).attr("name", newName);
        //$(this).attr("data-idx", filterCount);
        $(this).val("");
        $(this).prop('readonly', false);
    });
    // Increment all the data-idx attributes found in this new filter block.
    $(newFilter).find("[data-idx]").each(function() {
        $(this).attr("data-idx", filterCount);
    });
    $(newFilter).insertAfter(currentFilter);
});


// Remove a filter from the list.
$(".filterFields").on("mouseup touchup", "[data-remove-filter]", function() {
    if ( $(".filterField").length > 1 ) {
        $(this).parent().remove();
    } else {
        alert("Don't remove the last filter.");
    }
});

// Update the filter type options based on the selected field handle.
$(".filterFields").on("change", "[data-select-field]", function() {
    var index = $(this).attr("data-idx");
    var handle = $(this).val();
    var elementTypeKey = $("#elementTypeKey").val();
    if ( handle ) {
        // Populate the filter types dropdown with options.
        $.ajax({
            'url' : $("#fieldFilterOptionsUrl").val(),
            'type' : 'GET',
            'dataType' : 'html',
            'context' : $("select[data-select-filter-type][data-idx='"+index+"']"),
            'data' : {
                'fieldHandle' : handle,
                'elementTypeKey' : elementTypeKey
            },
            'success' : function(data, textStatus, jqXHR) {
                $(this).html(data);
                // Load the appropriate "value" field.
                $.ajax({
                    'url' : $("#valueFieldUrl").val(),
                    'type' : 'GET',
                    'dataType' : 'html',
                    'context' : $(".valueFieldContainer[data-idx='"+index+"']"),
                    'data' : {
                        'fieldHandle' : handle,
                        'index' : index,
                        'elementTypeKey' : elementTypeKey
                    },
                    'success' : function(data, textStats, jqXHR) {
                        $(this).html(data);
                        toggleValueFieldReadonly(index);
                        refreshSlimSelects();
                    }
                });
            }
        });
    }
});

// When the filter type changes, determine if the value field should be readonly.
$(".filterFields").on("change", "[data-select-filter-type]", function() {
    var index = $(this).attr("data-idx");
    toggleValueFieldReadonly(index);
});

// Toggle the "readonly" property on the value field based on filter type.
function toggleValueFieldReadonly(index)
{
    var filterType = $("[data-select-filter-type][data-idx='"+index+"']").val();
    var valueField = $("[data-filter-value][data-idx='"+index+"']");
    // Some filter types do not take values into account at all. Let's make that clear.
    if ( filterType == 'is empty' || filterType == 'is not empty' ) {
        valueField.val('');
        valueField.attr('readonly', true);
        valueField.prop('disabled', true);
    } else {
        valueField.attr('readonly', false);
        valueField.prop('disabled', false);
    }
}

// Delete filter on click to "Delete Filter" button
$(".deleteFilterButton").on("click", function(e){
    e.preventDefault();

    var thisForm  = $(this).parents("form.deleteFilterForm")
    var actionUrl = $(thisForm).attr('data-action');
    var formData  = $(thisForm).serializeArray();
    var thisRow   = $(thisForm).closest(".filter-row");

    $.ajax({
        "type": "POST",
        "url": actionUrl,
        "dataType": "json",
        "data": formData,
        "success": function(data, textStatus, jqXHR) {
            // Remove this row from the table
            $(thisRow).remove();
        },
        "error": function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
});

$("#content").on("click", "#addFilter", function() {
    addCriteriaFilter();
});

$("#content").on("change", "#downloadAttributes", function() {
    addCriteriaFilter();
});

$("#criteriaFields").on("click", "[data-remove-criteria]", function(e) {
    e.preventDefault();
    $(this).closest('.field').remove();
});

$("#content").on("click", "#refreshResults", function() {
    $("#reportsForm").attr('action', '');
    $("#reportsForm").submit();
});

$("#content").on("click", "#exportAsCsv", function() {
    $("#reportsForm").attr('action', $("#reportsForm").attr('data-export-action'));
    $("#reportsForm").submit();
});

$("#content").on("click", "#saveReport",  function(e) {
    e.preventDefault();
    var saveReportUrl = $("#reportsForm").attr('data-save-report-action');
    var formData = $("#reportsForm").serializeArray();
    formData.push({'name' : window.csrfTokenName, 'value' : window.csrfTokenValue});
    $.ajax({
        "type": "POST",
        "url": saveReportUrl,
        "dataType": "json",
        "data": formData,
        "success": function(data, textStatus, jqXHR) {
            if ( data['url'] !== undefined ) {
                window.location.href = data['url'];
            }
        },
        "error": function(jqXHR, textStatus, errorThrown) {

        }
    });
});

$("#content").on("click", "[data-delete-report]", function(e) {
    e.preventDefault();
    if ( confirm("Are you sure you want to delete this saved report?") ) {
        window.location = $(this).attr('href');
    } else {
        return false;
    }
});

$("#content").on("click", "#linkVaultCheckAll", function(event) {
    if(this.checked) {
        $("[data-linkvault-checkbox]").each(function() {
            this.checked = true;
        });
    } else {
        $("[data-linkvault-checkbox]").each(function() {
            this.checked = false;
        });
    }
});

$("#content").on("click", "#linkVaultDeleteSubmit", function(event) {
    if ( !confirm("Are you sure you want to delete the checked records?") ) {
        return false;
    }
});

function addCriteriaFilter()
{
    var fieldName = $("#downloadAttributes").val();
    // Make sure the specified criteria field doesn't already exist.
    if ( fieldName && ! $("#criteria_"+fieldName).length ) {
        var html = $("<div class='field' ><div class='heading'><label>"+fieldName+"</label></div><div class='input ltr' ><input type='text' class='text' name='criteria["+fieldName+"]' ><a href='#' class='light remove-criteria' title='Remove criteria' data-remove-criteria >X</a></div></div>");
        $(html).appendTo("#criteriaFields");
    }
}
