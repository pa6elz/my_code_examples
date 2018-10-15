let  $ETManager= {
    tables: {},

    onKeyUpHandler: function (event) {
        let codes = new Set([
            'Enter', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight',
            'ArrowUp', 'ArrowDown', 'Delete', 'Insert'
        ])

        if(codes.has(event.key)) {
            event.preventDefault()
            $ETManager.sendKeyUp(event, 'html')
        }
    },

    sendKeyUp: function (event, sender, block = false) {

        const {key, keyCode} = event

        let blockedTill
        if(blockedTill = $ETManager.blockedKeys[keyCode]) {
            delete $ETManager.blockedKeys[keyCode]
            if(blockedTill > performance.now()) return
        }

        const tableElem = document.querySelector('.editable-table#' + $ETManager.currentTableId);

        let keyupEvent      = new Event('keyup')

        keyupEvent.key      = key
        keyupEvent.keyCode  = keyCode
        keyupEvent.shiftKey = event.shiftKey
        keyupEvent.sender   = sender

        if(block) $ETManager.blockedKeys[keyCode] = performance.now() + block;
        tableElem.dispatchEvent(keyupEvent)
    },

    executeFunctionForTable: function(executeFunction, tableId, timeout) {

        const tableElement = document.getElementById(tableId)
        if(!tableElement) return

        const event = new Event('keyup')
        event.executeFunction = executeFunction

        const dispatch = () => tableElement.dispatchEvent(event)
        if(!isNaN(timeout)) {
            setTimeout(dispatch, timeout)
        } else {
            dispatch()
        }
    },
    
    initialize: function (tableId) {
        if(!("currentTableId" in $ETManager)) {
            $ETManager.currentTableId = tableId

            document
                .getElementsByTagName('html')[0]
                .addEventListener(
                    'keyup', $ETManager.onKeyUpHandler
                )
        }
    },

    blockedKeys: {},

    findParentOrThis: function(target, tag) {

        let parent = target;

        if(tag[0] === '.'){
            let className = tag.substr(1);
            while (parent && !parent.classList.contains(className)) {
                parent = parent.parentElement;
            }

            return parent;

        } else {
            let tagName = tag.toUpperCase(tag);

            while (parent && parent.tagName !== tagName){
                parent = parent.parentElement;
            }

            return parent;
        }
    },

    formats: {
        booleanFormat: (v, format) => format[+!v],

        dateFormat: function(date, format) {

            if(!date) return '';

            var d = new Date(date);

            var dateString = '';

            for (var i = 0; i < format.length; i++) {
                var letter = format[i];
                if(letter === 'Y') {
                    letter = d.getFullYear();
                } else if(letter === 'y') {
                    letter = d.getFullYear() % 100;
                } else if(letter === 'm') {
                    letter = d.getMonth() + 1;
                    if(letter < 10){
                        letter = '0' + letter;
                    }
                } else if(letter === 'd') {
                    letter = d.getDate();
                    if(letter < 10) {
                        letter = '0' + letter;
                    }
                } else if(letter === 'h') {
                    letter = d.getHours();
                } else if(letter === 'i') {
                    letter = d.getMinutes();
                } else if(letter === 's') {
                    letter = d.getSeconds();
                }

                dateString += letter;
            }

            return dateString;
        },

        stringFormat: function(v, str, data) {

            var reg = /\${([@_a-zA-Z][._a-zA-Z0-9]*)}/g;

            var retVal = str.replace(reg,
                function(r, param){
                    var parts = param.split('.');
                    var res = data;
                    while(parts.length) {
                        var part = parts.shift();
                        if(part === '@v') {
                            return v;
                        }
                        res = res[part];
                    }

                    return res;
                });

            return retVal;
        },

        modelFormat: (v, format) => v ? v[format] : '',

        enumFormat: (v, format) => format[v] || '',
    },

    filterConditions: [
        {
            name: 'equal',
            strings: 'equal,=,===',
            view: 'equal (=)',
            func: () => (value, condValue, condValue2) => value === condValue,
        },
        {
            name: 'notEqual',
            strings: 'notequal,<>,!=,!==',
            view: '!equal (<>)',
            func: () => (value, condValue, condValue2) => value !== condValue
        },
        {
            name: 'more',
            strings: 'more,morethan,>',
            view: 'more (>)',
            func: () => (value, condValue, condValue2) => value > condValue
        },
        {
            name: 'less',
            strings: 'less,lessthan,>',
            view: 'less (<)',
            func: () => (value, condValue, condValue2) => value < condValue
        },
        {
            name: 'moreOrEqual',
            strings: 'moreorequal,>=',
            view: 'more or equal (>=)',
            func: () => (value, condValue, condValue2) => value >= condValue
        },
        {
            name: 'lessOrEqual',
            strings: 'lessorequal,>=',
            view: 'less or equal (<=)',
            func: () => (value, condValue, condValue2) => value <= condValue
        },
        {
            name: 'inRange',
            strings: 'inrange',
            view: 'in range(>=, <=)',
            func: () => (value, condValue, condValue2) => value >= condValue
                && value <= condValue2
        },
        {
            name: 'inRange2',
            view: 'in range(>, <=)',
            func: () => (value, condValue, condValue2) => value > condValue
                && value <= condValue2
        },
        {
            name: 'inRange3',
            view: 'in range(>=, <)',
            func: () => (value, condValue, condValue2) => value >= condValue
                && value < condValue2
        },
        {
            name: 'inRange4',
            view: 'in range(>, <)',
            func: () => (value, condValue, condValue2) => value > condValue
                && value < condValue2
        },
        {
            name: 'inArray',
            strings: 'in,inarray',
            view: 'in array',
            func: () => (value, condValue, condValue2) => condValue.has(value)
        },
        {
            name: 'notInArray',
            strings: 'notinarray,notin',
            view: 'not in array',
            func: () => (value, condValue, condValue2) => !condValue.has(value)
        },
        {
            name: 'startsWith',
            strings: 'starts,startswith',
            view: 'starts with',
            func: () => (value, condValue, condValue2) => value.substr(0, condValue.length) === value
        },
        {
            name: 'notStartsWith',
            strings: 'notstarts,notstartswith',
            view: 'not starts with',
            func: () => (value, condValue, condValue2) => value.substr(0, condValue.length) !== value
        },
        {
            name: 'includes',
            strings: 'includes,consists,has',
            view: 'includes',
            func: () => (value, condValue, condValue2) => value.indexOf(condValue) !== -1
        },
        {
            name: 'notIncludes',
            strings: 'notincludes,notconsists,nothas',
            view: 'not includes',
            func: () => (value, condValue, condValue2) => value.indexOf(condValue) === -1
        },

    ],

    defaultControlsMap: {
        string: 'text',
        boolean: 'checkbox',
        enum: 'select',
        model: 'reference'
    },

    constants: {
        showControlModes: {
            SELECTED_CELL: 1,
            SELECTED_LINE: 2,
            ALWAYS: 3,
        },
        startEditingMode: {
            DBL_CLICK: 'DBLCLICK',
            CLICK: 'CLICK',
        },
        conditions: {
            EQUAL: 'equal',
            NOT_EQUAL: 'notEqual',
            MORE: 'more',
            LESS: 'less',
            MORE_OR_EQUAL: 'moreOrEqual',
            LESS_OR_EQUAL: 'lessOrEqual',
            IN_ARRAY: 'inArray',
            NOT_IN_ARRAY: 'notInArray',
            STARTS_WITH: 'startsWith',
            NOT_STARTS_WITH: 'notStartsWith',
            INCLUDES: 'includes',
            NOT_INCLUDES: 'notIncludes',
            IN_RANGE: 'inRange',
            NOT_IN_RANGE: '!InRange',
        }
    }
};

$ETManager.aggFunctions = {
    sum: {
        common(row, children, storage, path, newValue, oldValue) {
            let res = 0

            if(newValue === undefined) {
                for (let child of children) res += child[path]
            } else {
                res = +row.values[path] + newValue - oldValue
            }

            return res
        },

        type: 'number'
    },

    max: {
        common(row, children, storage, path, newValue, oldValue, countDiff) {

            const checkAll = () => {
                if(!children.length) {
                    res = null
                } else {
                    res = children[0][path]

                    for (let child of children)
                        if (child[path] > res) res = child[path]
                }
            }

            let res

            if(oldValue === undefined) {
                checkAll()
            } else {
                res = row.values[path] || 0
                if(newValue > oldValue) {
                    if(newValue > res) res = newValue
                } else if(oldValue === res) {
                    checkAll()
                }
            }

            return res
        }
    },

    min: {
        common(row, children, storage, path, newValue, oldValue, countDiff) {

            const checkAll = () => {
                if(!children.length) {
                    res = null
                } else {
                    res = children[0][path]

                    for (let child of children)
                        if (child[path] < res) res = child[path]
                }
            }

            let res

            if(oldValue === undefined) {
                checkAll()
            } else {
                res = row.values[path]
                if(newValue < oldValue) {
                    if(newValue < res) res = newValue
                } else if(oldValue === res) {
                    checkAll()
                }
            }

            return res
        }
    },
}

// OLD
class ETDataManager {

    constructor(income) {

        const defaults = {
            changedStates: {},
            row: null
        }

        Object.assign(this, defaults, income)

        checkValuesAndPaths()

        const datasetName = this.getDatasetName()
        this.dataSet = this.isGroup ? this.changedStates[datasetName] : this.state[datasetName]

        if(this.list) {
            this.reset()
        } else if (this.rowIndex) {
            this.readRow()
        }
    }

    checkValuesAndPaths() {
        if(!this.values) {
            const valuesGetter = (path) => {
                const f = ((path) => rowValues[path]).bind(null, path)
                return f
            }

            const viewsGetter = (path) => {
                const f = ((path) => rowViews[path]).bind(null, path)
                return f
            }

            const valuesSetter = (path) => {
                const f = ((path, value) => {
                    this.setValue(path, value)
                }).bind(null, path)

                return f
            }

            const viewsSetter = (path) => {
                const f = ((path, value) => {
                    this.setView(path, value)
                }).bind(null, path)

                return f
            }

            const valuesSets = [
                {obj: this.values   = {}, getter: valuesGetter  , setter: valuesSetter},
                {obj: this.views    = {}, getter: viewsGetter   , setter: viewsSetter},
            ]

            const paths = Object.keys(this.state.dataDefiner)
            for(let valuesSet of valuesSets) {
                for(let path of paths) {
                    Object.defineProperty(valuesSet.obj, path, {
                        get: valuesSet.getter(path),
                        set: valuesSet.setter(path),
                    })
                }
            }
        }
    }

    checkDataSet() {
        const datasetName = this.getDatasetName()
        if(!(datasetName in this.changedStates)) {
            this.dataSet = this.changedStates[datasetName] =
                ETDataManager.SPREAD_DATA
                    ? [...this.state[datasetName]] : this.state[datasetName]
        }
    }

    getSetServValue(property, value) {
        if(value === undefined) {
            return this.getServValue(property)
        } else {
            return this.setServValue(property, value)
        }
    }

    getServValue(property) {
        return this.sets.serv[property]
    }

    setServValue(property, value) {
        this.checkDataSet()
        this.checkChangedPart('serv')

        this.sets.serv[property] = value
    }

    setValue(property, value) {
        this.checkDataSet()
        this.checkChangedPart('values')

        const values = this.sets.values

        const oldValue = this.oldValues[path] = values[property]
        values[property] = value
    }

    setView(property, value) {
        this.checkDataSet()
        this.checkChangedPart('views')
        this.sets.views[property] = value
    }

    reset() {
        this.rowIndex = this.list[this.listIndex = 0]
        this.readRow()

        return this
    }

    moveNext() {
        this.rowIndex = this.list[++this.listIndex]
        this.readRow()

        return this
    }

    readRow() {
        if(!this.rowIndex) {
            this.row = null
            return
        }

        const row = this.row = this.dataSet[this.rowIndex - 1]

        this.changedFlags = {
            values: false,
            serv: false,
            views: false,
            children: false,
            childrenIndexes: false
        }

        if(this.isGroup) {
            this.sets = {
                values: row.values,
                serv: row,
                views: row.views,
                children: row.children,
                childrenIndexes: row.childrenIndexes,
            }
        } else {
            this.sets = {
                values: row,
                serv: row.$serv,
                views: row.$serv.views,
            }
        }

        this.oldValues = []
    }

    getDatasetName() {
        return isGroup ? 'dataGroups' : 'data'
    }

    exists() {
        return this.row ? true : false
    }

    row(index) {
        return this.getRow(index)
    }

    group(index) {
        this.getRow(index, true)
    }

    getRow(rowIndex, isGroup) {
        const params = {
            state           : this.state,
            changedStates   : this.changedStates,
            outerContext    : this.outerContext,
            values          : this.values,
            views           : this.views,
            isGroup,
            rowIndex,
        }

        return new ETDataManager(params)
    }

    level       (value = undefined) {return this.getSetServValue('level', value)}
    childrenType(value = undefined) {return this.getSetServValue('childrenType', value)}
    index       (value = undefined) {return this.getSetServValue('index', value)}
    sortIndex   (value = undefined) {return this.getSetServValue('sortIndex', value)}
    //level       (value = undefined) {return this.getSetServValue('level', value)}

    parent(parentIndex = undefined) {
        if(parentIndex) {
            this.setServValue('parent', parentIndex)
        } else {
            return this.getRow(this.getServValue('parent'), true)
        }
    }

    addChild(child) {
        if(!this.isGroup) return

        child.parent(this.index())
        child.sortIndex(this.children().length)

        checkChangedParts('children')
        this.children().push(child.index())

        this.changeCount(1, +child.filtered())

        if(child.childrenType()) {
            checkChangedParts('childrenIndexes')

        }
    }

    static createManager(state, outerContext) {
        return new ETDataManager({state, outerContext})
    }

    static get SPREAD_DATA() { return true }
}

class DataManager {
    constructor(state, changedStates = {}, spreadData = true) {
        this.state = state
        this.SPREAD_DATA = spreadData

        this.changedStates = changedStates

        this.initializeObjects()
    }

    initializeObjects() {
        const dataRowObject = this.dataRowObject = {

            getValue(path) {
                return this.data[path]
            },

            setValue(path, value) {
                if(this.setValueChecks) {
                    Manager.checkDataSpread(this.setValueChecks, this)
                }
                const oldValue = this.data[path]
                if(oldValue !== value) {
                    this.oldValues[path] = oldValue
                    this.data[path] = value

                    return true
                } else {
                    return false
                }
            },

            getView(path) {
                return this.data[this.Manager.symbolViews][path]
            },

            setView(path) {
                if(this.setViewChecks) {
                    this.checkDataSpread(this.setViewChecks)
                }
                this.data[DataManager.symbolViews][path] = this.Manager.columns[path].format(
                    this.data[path], this.data
                )
            },

            getProp(path) {
                return this.data[DataManager.symbolProps][path]
            },

            setProp(path, value) {
                if(this.setPropChecks) {
                    this.checkDataSpread(this.setPropChecks)
                }
                this.data[DataManager.symbolProps][path] = value
            },

            checkDataSpread(checksName) {
                for(let checkFunctionName of this[checksName]) {
                    this.Manager[checkFunctionName](this)
                }
                this[checksName] = null
            }
        }

        for(let column in this.state.columns) {
            const path = column.path[0]
            if(column.path[0] === '@') continue

            Object.defineProperty(dataRowObject, path, {
                get: dataRowObject.getValue.bind(dataRowObject, path),
                set: dataRowObject.setValue.bind(dataRowObject, path),
            })
        }

        const rowProps = ['level','parent','index','count', 'countFiltered', 'isClosed', 'groupPath']
        for(let prop of rowProps) {
            Object.defineProperty(dataRowObject, prop, {
                get: dataRowObject.getProp.bind(dataRowObject, path),
                set: dataRowObject.setProp.bind(dataRowObject, path),
            })
        }
    }

    checkDatasetSpread(rowObject) {
        const datasetName = rowObject.datasetName
        if(datasetName in this.changedStates) return

        const dataset = this.state[datasetName]
        this.changedStates[datasetName] = this.SPREAD_DATA ? [...dataset] : dataset
    }

    checkRowSpread(rowObject) {
        const datasetName = rowObject.datasetName
        if(datasetName in this.changedStates) return

        const dataset = this.state[datasetName]
        this.changedStates[datasetName] = this.SPREAD_DATA ? [...dataset] : dataset
    }

    getRow(row) {
        const rowObj = this.createRowObject(false)
        rowObj.index = typeof row === 'number' ? row : row.$props.index

        return rowObj
    }

    getGroup (group) {
        const groupObj = this.createRowObject(true)
        groupObj.index = typeof group === 'number' ? group : group.$props.index

        return groupObj
    }
    
    static get symbolViews() {return Symbol.for('views')}
    static get symbolProps() {return Symbol.for('props')}
}


// *******  MAIN CLASS ********
class EditableTable extends React.Component {

    constructor(props) {
        super(props)

        const incomingState = this.props.state
        const settings = incomingState.settings

        $ETManager.initialize(settings.tableId)

        //Дополнение колонок и данных
        this.initializeData(incomingState)

        //Фильтр
        if(this.state.filter.hasFilter) {
            this.filterData()
        }

        //Построение дерева
        this.createDataTree()

        this.state.initial = false
    }

    // INITIALIZATION ~~~~~~~~~~~

    initializeData(state) {

        let {settings, dataDefiner, data, columns, sorting = '', grouping = '', totals = '', filter = ''} = state

        const {showControlModes, startEditingMode} = $ETManager.constants

        settings.showControlsMode = settings.showControlsMode || showControlModes.SELECTED_CELL

        if(settings.showControlsMode !== showControlModes.ALWAYS) {
            settings.startEditingMode = settings.startEditingMode || startEditingMode.DBL_CLICK
        }

        if (!dataDefiner) dataDefiner = {}
        if (!data) data = []

        const dataChangedStates = {settings, dataDefiner, data, columns}

        this.completeDataDefiner(dataChangedStates)
        this.completeColumnData(dataChangedStates)
        this.completeTableData(dataChangedStates)

        if (typeof sorting === 'string') {
            sorting = sorting.split(',')
        }

        for (let i = 0; i < sorting.length; i++) {
            if (typeof sorting[i] === 'string') {
                let [path, direction = 'asc'] = sorting[i].split(' ')
                direction = direction.toLowerCase() === 'desc' ? -1 : 1

                sorting[i] = {path, direction}
            }
        }

        if (typeof grouping === 'string') {
            grouping = grouping.split(',')
        }

        for(let i = 0; i < grouping.length; i++) {
            if(typeof grouping[i] === 'string') {
                grouping[i] = {path: grouping[i]}
            }
        }

        if (typeof totals === 'string') {
            totals = totals.split(',').reduce((agg, v) => {
                const [key, value] = v.split(' ')
                agg[key] = value
                return agg
            }, {})
        }

        if(typeof filter === 'string') {
            filter = this.filterFromString(filter, dataDefiner)
        }

        const changedStates = {sorting, grouping, totals, filter}

        this.state = {
            ...state,
            ...dataChangedStates,
            ...changedStates,
            selection: {editing: false},
            initMode: true,
        }
    }

    completeDataDefiner(state) {

        const {dataDefiner, data, columns} = state

        const defaultValuesMap = {
            string: '',
            number: '0',
            date: '1900-01-01',
            boolean: false,
        }

        let path, field

        // Заполняем настройки полей из опций колонок
        for (let column of columns) {

            path = column.path
            if(!path || path[0] === '@') continue

            if (!(path in dataDefiner)) {
                const definerItem = {}
                for (field of ['type', 'values', 'source', 'formula', 'onChange']) {
                    if (column[field]) {
                        definerItem[field] = column[field]
                    }
                }
                dataDefiner[path] = definerItem
            }
        }

        if (data.length) {
            for (let k in data[0]) {
                if (!(k in dataDefiner))
                    dataDefiner[k] = {}
            }
        }

        const allPaths = Object.keys(dataDefiner)
        const formulaRegExp = new RegExp('\.(' + allPaths.join('|').toLowerCase() + ')', 'g')

        for (path of allPaths) {

            field = dataDefiner[path]
            if (typeof field === 'string') {
                field = dataDefiner[path] = {type: field}
            }

            let type = field.type || this.determineDataColumnType(data, path)
            if(typeof type === 'function') {
                continue
            }
            let isRequired = false, isPositive = false

            const splitedType = type.split(/[-.]/)

            while(true) {
                const lastElem = splitedType[splitedType.length - 1]
                if(
                    !isRequired && (isRequired = lastElem.startsWith('req')) ||
                    !isPositive && (isPositive = lastElem.startsWith('pos')) ) {
                        splitedType.pop()
                        continue
                }

                break
            }

            let [part1, part2, part3] = splitedType
            if(part1.startsWith('set of ')) {
                field.isArray = true;
                part1 = part1.substr(7)
            }

            field.type = type = part1

            switch (type) {
                case 'model':
                    field.subtype = part2
                    break

                case 'number':
                    field.precision = part3 || 0

                case 'string':
                    field.length = part2
                    break
            }

            field.validation = field.validation || {}

            if(isRequired) {
                field.validation.required = true
            }

            if(isPositive) {
                field.validation.positive = true
            }

            if(!isNaN(field.length)) {
                const validationField = type === 'number' ? 'length' : 'maxlength'
                field.validation[validationField] = field.length
            }

            if('precision' in field) {
                field.validation.precision = field.precision
            }

            if (!('default' in field)) {
                field.default = defaultValuesMap[type]
            }

            if(typeof field.formula === 'function') {
                let dependsOn = ('' + field.formula).toLowerCase().match(formulaRegExp)
                if(dependsOn) {
                    dependsOn = new Set(dependsOn)
                    for(let p of dependsOn) {
                        const dependsPath = p.substr(1)
                        const depended = dataDefiner[dependsPath].depended
                                        = dataDefiner[dependsPath].depended || []

                        depended.push(path)
                    }
                }
            }
        }

    }

    completeColumnData(state) {

        const {
            booleanFormat,
            dateFormat,
            stringFormat,
            modelFormat,
            enumFormat
        } = $ETManager.formats

        const defaultControlsMap = $ETManager.defaultControlsMap

        const defaultAlignMap = {
            boolean: 'center',
            number: 'right'
        }

        let {columns, dataDefiner} = state

        const columnGroups = {path: '@group'}
        if (columns[0].path === '@serial' || columns[0] === '@serial') {
            columns = [columns.shift(), columnGroups, ...columns]
        } else {
            columns = [columnGroups, ...columns]
        }
        state.columns = columns

        for (let i = 0; i < columns.length; i++) {

            let column = columns[i]
            if (typeof column === 'string') {
                column = columns[i] = {path: column}
            }

            const path = column.path
            let field = {}, type

            if(path[0] !== '@') {
                field = column.field = dataDefiner[path]
                type = field.type
            }

            if (!column.title) {
                if (path === '@serial') {
                    column.title = '#'
                } else if (path[0] !== '@') {
                    column.title = path[0].toUpperCase() + path.substr(1)
                }
            }

            column.control = column.control || (path[0] !== '@' &&
                (defaultControlsMap[type] || type || 'text'))

            if (field.formula) column.control = null

            column.align = column.align || defaultAlignMap[type] || 'left'

            if (column.format) {
                if (typeof column.format === 'string') {
                    column.formatParam = column.format
                    column.format = stringFormat
                }
            } else if (type === 'boolean' && !column.booleanFormat) {
                column.booleanFormat = ['✓', '']
            } else if (type === 'date' && !column.dateFormat) {
                column.dateFormat = 'd-m-Y'
            }

            if (column.format) {
            } else if (column.booleanFormat) {
                column.formatParam = column.booleanFormat
                column.format = booleanFormat
            } else if (column.dateFormat) {
                column.formatParam = column.dateFormat
                column.format = dateFormat
            } else if (column.numberFormat) {
                column.formatParam = column.numberFormat
                column.format = numberFormat
            } else if (type === 'model') {
                column.formatParam = 'name'
                column.format = modelFormat
            } else if (type === 'enum') {
                let valuesIndex = {}
                field.values = field.values.map(value => {
                    if(typeof value !== 'object') {
                        const view = value[0].toUpperCase() + value.substr(1).toLowerCase()
                        valuesIndex[value] = view
                        return {value, view}
                    } else {
                        valuesIndex[value.value] = value.view
                        return value
                    }
                })

                column.formatParam = valuesIndex
                column.format = enumFormat
            }

        }
    }

    completeTableData({data, dataDefiner, columns}) {

        const calculated = this.getCalculatedFields(dataDefiner)
        const columnsWithView = columns.filter(c => c.format)

        for (let i = 0; i < data.length; i++) {
            const row = data[i]

            row.$serv = {
                index       : i + 1,
                filtered    : true,
                views       : {},
            }

            this.calculateRowValues(row, calculated)
            this.setRowViews(row, columnsWithView)
        }
    }

    // EVENTS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    componentDidMount() {
        let tableElem = ReactDOM.findDOMNode(this.refs.t)
        tableElem.addEventListener('keyup', this.onKeyUpHandler.bind(this))
    }

    onRefreshDataHandler() {
        this.setNewState({data: [...this.state.data]})
    }

    onValueChangeHandler(row, column, value) {
        this.changeTableValues({row, column, value})
    }

    onClickHandler(row, column) {

        let onClickAction = 'select' //Также могут быть edit и т.п.

        $ETManager.currentTableId = this.state.settings.tableId

        switch (onClickAction) {
            case 'select':
                this.selectCell(row, column)
                break
        }
    }

    onDblClickHandler() {

        let onDblClickAction = 'edit'
        if(!onDblClickAction) retutn

        switch (onDblClickAction) {
            case 'edit':
                this.startEditing()
                break
        }
    }

    onKeyUpHandler(event) {

        if(event.executeFunction) {
            event.executeFunction(this)
            return
        }

        event.stopPropagation()

        const {key, keyCode} = event
        let selection = this.state.selection

        let changes

        switch (key) {

            case 'Enter':
                //Нажат Энтер, заканчиваем или начинаем режактирование
                //  в зависимости от состояния строки
                if (selection.row) {
                    if (selection.editing) {
                        if (!event.target.classList.contains('select')
                            || event.sender === 'select') {
                                const res = this.finishEditing(selection = {...selection})
                                if(!res) return

                                changes = {...res, selection: {...selection, editing: false}}
                        }
                    } else {
                        this.onDblClickHandler()
                    }
                }
                break

            case 'Escape':
                //Нажат Esc, вызываем функцию отмены редактирования
                if (selection.editing) {
                    this.cancelEditing()
                }
                break

            case 'ArrowLeft':
            case 'ArrowRight':
                //Нажаты стрелки влево-вправо, сдвигаем выделение ячейки
                if (selection.row && !selection.editing) {
                    const column = this.findNextColumn(selection.column, keyCode - 38)
                    if(!column) return

                    changes = {selection: {...selection, column: column.path}}
                }
                break

            case 'ArrowUp':
            case 'ArrowDown':
                //Нажаты стрелки вверх-вниз, сдвигаем выделение строки
                this.moveSelectionUpDown(keyCode - 39)
                break

            case 'Tab':
                //Нажат Tab, переходим к редактированию следующей или
                //  при нажатом шифте предыдущей ячейки
                if (selection.editing) {
                    const column =
                        this.findNextColumn(selection.column, event.shiftKey ? -1 : 1, true)

                    if (column) {
                        this.onClickHandler(selection.row, column)
                    }
                }
                break

            case 'Insert':

                this.addRow()
                break

            case 'Delete':

                // Нажат delete
                this.deleteRow()
                break

            default:
        }

        if(changes) this.setNewState(changes);
    }

    onColumnClickHandler(event) {

        const element = $ETManager.findParentOrThis(event.target, '.column-header')
        if (!element) return

        const column = this.getColumn(element.dataset.path)
        if (!column) return

        const path = column.path,
            direction = column.sort ? column.sort.direction === 1 ? -1 : 0 : 1,
            newSort = direction ? [{path, direction}] : []

        this.setNewSortOrder(newSort)

        this.sortData()
    }

    onMenuItemClickHandler(button, event) {

        const action = button.action

        if(typeof action === 'function') {
            action(this)
        } else {
            switch (action.toLowerCase()) {
                case 'add':
                    this.addRow()
                    break
                case 'delete':
                    this.deleteRow()
                    break
                case 'settings':
                    this.showHideSettings()
                    break
            }
        }
    }
    
    onChangeStateHandler(state) {
        if(this.props.onChangeStateHandler) {
            state = this.props.onChangeStateHandler(state) || state
        } else {
            const synchronize = this.state.settings.synchronize
            if (synchronize) {
                state = synchronize.object.execute(state, synchronize.name) || state
            }
        }

        return state
    }

    // DATA EXECUTIONS

    createDataTree(state = this.state, newGroups = null) {

        const {columns, sorting, filter, totals, initMode, data: stateData} = state
        const data = initMode ? stateData : [...stateData]

        let grouping = this.state.grouping
        if(newGroups) {
            state.grouping = grouping = newGroups
        }

        //Получим массив колонок группировки и итогов
        const {groupColumns, totalColumns} = this.getColumns()

        const dataGroups = []
        // Создадим корневую группу
        const root = this.createDataGroup(dataGroups, null, groupColumns)

        root.hidden = totalColumns.length === 0

        //Находим или создаем группировки для каждой строки
        for (let i = 0; i < data.length; i++) {
            this.findGroupForDataRow(data[i], dataGroups, groupColumns, true)
        }

        this.countFiltered(state, dataGroups, data)

        if(initMode) {
            state.dataGroups = dataGroups
        } else {
            this.setNewState({dataGroups, data, grouping})
        }
    }

    sortData(state = this.state) {

        let {dataGroups, data} = state
        if(!state.initial) {
            dataGroups = [...dataGroups]
            data = [...data]
        }

        this.sortDataTree({...state, data, dataGroups, ind: 1})
        this.setNewState({data, dataGroups})
    }

    filterData(state = this.state) {

        const OR = 'OR', OR_BRACKET = 'OR (', AND = 'AND', AND_BRACKET = 'AND (', CLOSE_BRACKET = ')'

        const filterConditionsMap = $ETManager.filterConditions.reduce(
            (agg, cond) => {agg[cond.name] = cond; return agg},
            {}
        )

        const getfilterFunction = condition => {
            const conditionFunction = filterConditionsMap[condition].func()
            const filterFunction = (path, condValue, condValue2, row) => {
                let rowValue = row[path[0]]
                if(path.length > 1) {
                    for(let i = 1; i < path.length - 1; i++) {
                        rowValue = rowValue[path[i]]
                    }
                }

                return conditionFunction(rowValue, condValue, condValue2)
            }

            return filterFunction
        }

        const prepareFunction = function(filtersArr) {
            const arr = [[]]
            let addArr = arr[0], brackets = [], bracketMode = 0

            for(let filter of filtersArr) {
                if (!filter.use) continue

                const {type, field, condition, value, value2, inBrackets} = filter
                let executeFunc

                if (type === OR || type === OR_BRACKET) {
                    arr.push(addArr = [])
                }

                if(type === OR_BRACKET || type === AND_BRACKET || type === CLOSE_BRACKET) {
                    bracketMode += (type === CLOSE_BRACKET ? -1 : 1)
                    if(!bracketMode) {
                        execureFunc = executeFunction(prepareFunction(brackets))
                        addArr.push(executeFunc)

                        brackets = []
                        continue
                    } else if (bracketMode === 1) {
                        continue
                    }
                }

                if(bracketMode) {
                    brackets.push(filter)
                } else {
                    executeFunc = getfilterFunction(condition).bind(null, field.split('.'), value, value2)
                    addArr.push(executeFunc)
                }
            }

            return arr
        }

        const executeFunction = function (conditions) {
            const retVal = (arr, row) => {
                for(let i = 0; i < arr.length; i++) {
                    const addArr = arr[i]
                    let filtered = true
                    for(let j = 0; j < addArr.length; j++) {
                        filtered = addArr[j](row)
                        if(!filtered) break
                    }

                    if(filtered) return true
                }
                return false
            }

            return retVal.bind(null, conditions)
        }

        const data     = state.initial ? state.data        : [...state.data]
        let dataGroups = state.dataGroups
        if(dataGroups && !state.initial) {
            dataGroups = [...dataGroups]
        }

        const {filters, hasFilter} = state.filter
        const rowExecuteFunction = hasFilter
            ? executeFunction(prepareFunction(filters))
            : false

        let serv, filtered
        for(let i = 0; i < data.length; i++) {
            serv = data[i].$serv
            if(serv.deleted) continue

            filtered = !rowExecuteFunction || rowExecuteFunction(data[i])
            if(serv.filtered !== filtered) {
                data[i].$serv = {...serv, filtered}
            }
        }

        if (dataGroups) {
            this.countFiltered(state, dataGroups, data, hasFilter)
        }

        return {data, dataGroups}
    }


    // ***** creating groups
    createDataGroup(dataGroups, parent = null, groups = null, row = null, value = null, isNew = false) {

        const {level: parentLevel, index: parentIndex} = parent || {level: -1, index: 0}

        const index             = dataGroups.length + 1
        const sortIndex         = parent ? parent.children.length : 0
        const level             = parentLevel + 1
        const childrenType      = groups.length === level ? 1 : 2
        const groupValuePath    = parent ? groups[level - 1].path : null
        const rootShow          = level && !dataGroups[0].hidden

        const newGroup = {
            index,
            sortIndex,
            level,
            groupPath: groupValuePath,
            children: [],
            childrenIndexes: {},
            childrenType,
            count: 0,
            countFiltered: 0,
            views: {},
            values: {},
            show: true,
            rootShow,
        }

        if (parent) {
            newGroup.parent = parentIndex
            parent.children.push(index)
            parent.childrenIndexes[value] = index

            newGroup.values['@group'] = row[groupValuePath]
            if (groupValuePath in row.$serv.views) {
                newGroup.views['@group'] = row.$serv.views[groupValuePath]
            }
        }

        if (isNew) {
            newGroup.isNew = true
        }

        dataGroups.push(newGroup)
        return newGroup
    }

    // Находит нужную группировку для строки по ее данным, если таковой нет, то создает
    // Вызывается при
    //  - изменении списка группировок
    //  - создании новой строки
    //  - изменении данных строки, влияющих на принадлежность группировке
    findGroupForDataRow(row, dataGroups, groupColumns, initialization = false, isNew = false) {

        // Ищем ветки группировок в существующей структуре групп, если нет то создаем
        let currentGroup = dataGroups[0]
        for (let i = 0; i < groupColumns.length; i++) {
            const value = this.getSimpleValue(row, groupColumns[i])

            currentGroup = !isNew && (value in currentGroup.childrenIndexes)
                ? dataGroups[currentGroup.childrenIndexes[value] - 1]
                : this.createDataGroup(dataGroups, currentGroup, groupColumns, row, value, isNew)
        }

        //В группировку последнего уровня добавляем индекс строки данных
        // а для строки данных в свойство parent устанавливаем индекс группировки
        if(!initialization) {
            currentGroup = this.copyDataRow(currentGroup.index, dataGroups)
        }

        currentGroup.children.push(row.$serv.index)
        row.$serv = {...row.$serv, parent: currentGroup.index}

        if(!initialization) {
            row.$serv.sortIndex = currentGroup.children.length - 1
            this.releaseCurrent(currentGroup)
        }
    }

    removeRowFromGroup(dataGroups, data, row, selection = null, deleting = false, filteringOut = false) {

        // 1. Копируем строку и родителя и делаем пометку удаления из группы
        row = this.copyDataRow(row.$serv.index, data)

        const rowServ = row.$serv
        const parent = this.copyDataRow(rowServ.parent, dataGroups)

        if(deleting) rowServ.deleted = true

        // 2. Создаем массив removable, куда добавим родителя строки
        // и родителя верхней пустой группы, в случае если удаляемая строка
        // в одной или нескольких группах будет единственной
        const removable = []
        if(!filteringOut) {
            removable.push({group: parent, sortIndex: rowServ.sortIndex})
        }

        // 3. Проходим по всем родителям и уменьшаем значение count и countFiltered
        let group = parent, groupCount, removableGroup
        while(true) {

            //Если передана строка, которая просто не прошла фильтр
            // ее не требуется удалять физически, просто уменьшить значение countFiltered
            // у родителей
            group.count -= !filteringOut
            group.countFiltered --

            if(group.parent) {
                if(!group.count) {
                    group.deleted = true
                    removableGroup = group
                }
                group = dataGroups[group.parent - 1]
            } else {
                break
            }
        }

        // 4. Самого верхнего пустого родителя, за исключением итоговой строки
        // включаем в список удаляемых групп
        if(removableGroup) {
            const parentGroup = this.copyDataRow(removableGroup.parent, dataGroups)
            removable.push({
                group: parentGroup,
                sortIndex: removableGroup.sortIndex,
                value: removableGroup.values['@group'],
            })
        }

        let rowSortIndex = rowServ.sortIndex

        // 5. удаляем строки из групп
        for(let r of removable) {

            const {sortIndex, group, value} = r
            const deletingIsGroup = group.childrenType === 2

            // удаление
            group.children.splice(sortIndex, 1)
            if(deletingIsGroup) {
                delete group.childrenIndexes[value]
            }

            // Индексирование
            if(sortIndex < group.children.length) {
                this.indexData(group, dataGroups, data, sortIndex)
            } else if(!deletingIsGroup) {
                rowSortIndex --
            }

            this.releaseCurrent(group)
        }

        // 6. Изменяем выделение в случае если передан объект selection,
        // он передается когда удаляется текущая выделенная строка
        if(selection) {
            let selectedIndex
            if(!parent.deleted) {
                selectedIndex = this.findFirstFiltered(data, parent, rowSortIndex, 1)
                if (typeof selectedIndex !== 'number') {
                    selectedIndex = this.findFirstFiltered(data, parent, rowSortIndex, -1)
                }
            }

            selection.row = selectedIndex
        }

        // 7. Подсчет итогов
        this.countTotalsOnAddDelete(dataGroups, data, row, -1)

        // 8. Удаление опустевших групп из массива групп
        Array.from([dataGroups, data]).forEach((dataset, ind) => {
            let length = dataset.length
            do {
                let dataRow = dataset[length - 1]
                if(ind) dataRow = dataRow.$serv

                if(!dataRow.deleted) break
            } while (--length)

            if(length < dataset.length) {
                dataset.length = length
            }
        })

        // 9. Освобождаем строку
        this.releaseCurrent(row)
    }

    addRowToGroup(dataGroups, data, row) {

        row = this.copyDataRow(row.$serv.index, data)

        const groupColumns = this.getColumns('grouping')

        this.findGroupForDataRow(row, dataGroups, groupColumns, false, row.$serv.isNew)
        this.countTotalsOnAddDelete(dataGroups, data, row, 1)

        const parent = this.copyDataRow(row.$serv.parent, dataGroups)
        parent.count ++
        parent.countFiltered += +(!this.hasFilter() || row.$serv.filtered)

        if(parent.children.length > 1) {
            this.sortSingleItems(dataGroups, data, [row])
        }

        this.releaseCurrent(parent)
        this.releaseCurrent(row)
    }


    // ***** sorting
    getLevelsSortOrder({dataGroups, columns, sorting, grouping, totals}) {

        const sortColumns = this.getColumns('sorting', null, true)

        const levelsSortOrder = []
        const groups = []

        let group = dataGroups[0]
        while (group) {

            const isGroup = group.childrenType > 1

            let levelSortColumns, groupColumnPath, groupColumn

            if (isGroup) {

                group = dataGroups[group.children[0] - 1]
                groupColumnPath = group.groupPath

                levelSortColumns = sortColumns.filter(v => v.total)
                if (groupColumn = sortColumns.find(c => c.path === groupColumnPath)) {
                    levelSortColumns.push(groupColumn)
                }
                groups.push(groupColumnPath)
            } else {
                group = null
                levelSortColumns = sortColumns.filter(c => !groups.includes(c.path))
            }

            levelSortColumns = levelSortColumns.map(c => {

                const path = []

                let type = c.field.type
                let aggFunc

                // Для итогов тип может отличаться в зависимости от итоговой функции
                // Тип нужен для определения способа сортировки: по значению или по представлению
                if (isGroup && !c.group && (aggFunc = this.aggFunction(c.total.func))) {
                    type = aggFunc.type || type
                }

                const useView = (type === 'enum' || type === 'model')

                if (isGroup) {
                    path[0] = useView ? 'views' : 'values'
                } else if (useView) {
                    path[0] = '$serv'
                    path[1] = 'views'
                }

                path.push(c.path)

                return {path, direction: c.sort.direction}

            })

            levelSortColumns.push({
                path: (isGroup ? [] : ['$serv']).concat(['index']),
                direction: 1
            })

            levelsSortOrder.push(levelSortColumns)
        }

        return levelsSortOrder
    }

    compareRows(sortColumns, dataObjects, a, b) {
        for (let column of sortColumns) {
            const {path, direction} = column

            let val1 = dataObjects[a - 1],
                val2 = dataObjects[b - 1]

            for (let i = 0; i < path.length; i++) {
                val1 = val1[path[i]]
                val2 = val2[path[i]]
            }

            if (val1 === val2) continue

            return (val1 < val2 ? -1 : 1) * direction
        }

        return -1
    }

    sortDataTree({ind, dataGroups, data, recursive = true, levelsSortOrder = null, initMode = false}) {

        if (!levelsSortOrder) {
            levelsSortOrder = this.getLevelsSortOrder(this.state)
        }

        let parent = dataGroups[ind - 1]
        const {level, childrenType} = parent
        const sortColumns = levelsSortOrder[level]

        if (sortColumns.length) {
            const dataObjects = childrenType === 1 ? data : dataGroups

            const compareRows = this.compareRows.bind(null, sortColumns, dataObjects)
            if(!initMode) {
                parent.children = [...parent.children]
            }

            parent.children.sort(compareRows)
        }

        this.indexData(parent, dataGroups, data)

        if (recursive && childrenType > 1) {
            for (let ind of parent.children) {
                this.sortDataTree({ind, dataGroups, data, levelsSortOrder, initMode})
            }
        }
    }

    sortSingleItems(dataGroups, data, rows, sortOrder = null) {

        if (!sortOrder) sortOrder = this.getLevelsSortOrder(this.state)

        for(let row of rows) {

            const isGroup = row.childrenType

            const rowServ = isGroup ? row : row.$serv
            if(rowServ.deleted || !rowServ.parent) continue

            const rowIndex = rowServ.index
            const parent = this.copyDataRow(dataGroups[rowServ.parent - 1])
            const children = parent.children

            let spliceIndex = rowServ.sortIndex
            if(isNaN(spliceIndex)) {
                spliceIndex = children.length - 1
                if(children[spliceIndex] !== rowIndex) {
                    spliceIndex = children.indexOf(rowIndex)
                    if(spliceIndex < 0) continue
                }
            }
            children.splice(spliceIndex, 1)

            const dataObjects = isGroup ? dataGroups : data
            const sortColumns = sortOrder[parent.level]

            const compareRows = this.compareRows.bind(null, sortColumns, dataObjects)

            let newPos = 0, max = children.length - 1
            while(newPos <= max) {
                const compareRowPos = Math.floor((newPos + max) / 2)
                const compareRowIndex = children[compareRowPos]

                if(compareRows(rowIndex, compareRowIndex) < 0) {
                    max = compareRowPos - 1
                } else {
                    newPos = compareRowPos + 1
                }
            }

            if(newPos !== row.sortIndex) {

                children.splice(newPos, 0, rowIndex)

                const parentData = this.copyDataRow(parent.index, dataGroups)
                parentData.children = children

                this.indexData(parentData, dataGroups, data, newPos)

                this.releaseCurrent(parentData)
            }
        }
    }


    // ***** filtering
    countFiltered(state, dataGroups, data, hasFilter = this.hasFilter()) {

        const {columns, sorting, grouping, totals, initMode} = state
        const totalColumns = this.getColumns('totals')

        const levelGroups = this.getGroupsLevels(dataGroups)
        const lastLevelGroups =levelGroups.pop()
        const filteredCount = {}

        // 1. Подсчитываем количество прошедших фильтр
        //  по последнему уровню группировки
        if(hasFilter) {
            for(let group of lastLevelGroups) {
                filteredCount[group.index] = 0
            }

            for(let i = 0; i < data.length; i++) {
                const rowServ = data[i].$serv
                if(rowServ.filtered) {
                    filteredCount[rowServ.parent] ++
                }
            }
        }

        let level = lastLevelGroups
        for(let group of level) {
            group.count = group.children.length
            group.countFiltered = hasFilter ? filteredCount[group.index] : group.count
        }

        while(level = levelGroups.pop()) {
            for(let group of level) {
                let count = 0, countFiltered = 0, childIndex, child
                for(childIndex of group.children) {
                    child = dataGroups[childIndex - 1]

                    count += child.count
                    countFiltered += child.countFiltered
                }

                group.count = count
                group.countFiltered = countFiltered
            }
        }

        const levelsSortOrder = this.getLevelsSortOrder(
            {dataGroups, columns, sorting, grouping, totals})

        // Считаем итоги по группировкам или общие
        if (totalColumns.length) {
            this.countTotals({dataGroups, data, columns: totalColumns})
        }

        this.sortDataTree({ind: 1, dataGroups, data, levelsSortOrder, initMode})
    }


    //Функция подсчета итогов по группировкам и по таблице в целом
    countTotals({dataGroups,
                    data,
                    columns,
                    sortOrder,
                    row,
                    oldValues,
                    column,
                    oldValue,
                    justCount = false,
                    changedCount = 0}) {

        const changedRows = []

        let levels
        let newValues

        // Если передана одна единственная строка, то найдем всех
        //  ее родителей
        if (row) {
            levels = this.getParents(dataGroups, row)
                                    .reverse()
                                    .map(v => [v])
            newValues = {...row}
        } else {
            levels = this.getGroupsLevels(dataGroups)
        }

        if (column) {
            columns     = [column]
            oldValues   = {
                [column.path]: oldValue
            }
        }

        const columnsWithView  = columns.filter(c => c.hasView)

        let level, started
        while (level = levels.pop()) {

            let changes = false
            for (let groupRow of level) {

                const children = this.getChildrenValues(groupRow, dataGroups, data)

                let path, storage, dataOldValue, dataNewValue, groupOldValue, groupNewValue

                groupRow.storage = {}
                for (let column of columns) {

                    path        = column.path
                    storage     = groupRow.storage[path] = {}

                    if(row) {
                        dataOldValue = oldValues[path]
                        dataNewValue = newValues[path]
                    }

                    groupOldValue = groupRow.values[path]
                    groupNewValue = column.total.common(
                            groupRow,
                            children,
                            storage,
                            path,
                            dataNewValue,
                            dataOldValue,
                            changedCount
                        )

                    if(row) {
                        groupRow.values = {...groupRow.values, [path]: groupNewValue}

                        oldValues[path] = groupOldValue
                        newValues[path] = groupNewValue
                    } else {
                        groupRow.values[path] = groupNewValue
                    }

                    changes = changes || groupOldValue !== groupNewValue
                }

                if(changes) {
                    if(row) {
                        changedRows.push(groupRow)
                    }
                    if (columnsWithView.length) this.setRowViews(groupRow, columnsWithView)
                }
            }

            if (!changes) break

            started = true
        }

        if(changedRows.length && !justCount) {
            if(changedCount !== -1) {
                changedRows.unshift(row)
            }
            this.sortSingleItems(dataGroups, data, changedRows, sortOrder)
        }
    }

    // others
    indexData(parent, dataGroups, data, start = 0) {

        const children = parent.children

        if (parent.childrenType === 1) {
            for (let i = start; i < children.length; i++) {
                const row = data[children[i] - 1]
                row.$serv = {...row.$serv, sortIndex: i}
            }
        } else {
            for (let i = start; i < children.length; i++) {
                dataGroups[children[i] - 1].sortIndex = i
            }
        }
    }


    //-------------------------\\
    
    setNewState(state) {
        state = this.onChangeStateHandler(state)
        this.setState(state)
    }

    selectCell(row, column, state = null) {

        state = state || this.state
        const selection = state.selection

        const newRowIndex   = typeof row === 'object'
                                ? this.getUniqueIndex(row)
                                : row

        const currRowIndex  = selection.row

        if(typeof column === 'string') {
            column = this.getColumn(column)
        }

        const editing =
            selection.editing
                && newRowIndex === currRowIndex
                && column.control ? true : false

        let changedData = {}
        if(selection.editing && (!editing || newRowIndex !== currRowIndex)) {
            changedData = this.finishEditing()
            if(!changedData) return
        }

        const newSelection = {
            row: newRowIndex,
            column: column.path,
            editing
        }

        this.setNewState({...changedData, selection: newSelection})
    }

    // Если в state передан уже готовый объект со свойством changedProperties,
    //  то считываем свойства из него и копируем в зависимости от флага
    //  соответствующего свойства в массиве properties
    getStateProperties(properties, state = this.state) {
        const propMap = {}
        for(pName in properties) {
            let value = state.changedProperties ? state.changedProperties[pName] : null
            value = value || (properties[pName] ? [...state[pName]] : state[pName])

            propMap[pName] = value
        }

        return propMap
    }

    startEditing(state = this.state, changedProperties = {}) {

        let {dataGroups, data, selection} = changedProperties
        selection = selection || {...state.selection}
        if(selection.editing) {
            return
        }

        dataGroups = dataGroups || state.dataGroups
        data = data || [...state.data]

        const localChanges = {data, selection}

        const column = this.getColumn(selection.column)
        if(!column || !column.control) return

        //Делаем копию
        const row = this.copyDataRow(selection.row, data)
        const copy = {...row, $serv: {...row.$serv, views: {...row.$serv.views}}}

        //Сохраняем в копию данные родителей, чтобы в случае отмены моментально восстановить
        // итоговые цифры
        const parentData = {}

        let parentIndex = row.$serv.parent
        while (parentIndex) {
            const parent = dataGroups[parentIndex - 1]

            parentData[parent.index] = {
                views   : {...parent.views},
                values  : {...parent.values}
            }

            parentIndex = parent.parent
        }

        copy.$serv.parents = parentData

        row.$serv.copy = copy

        selection.editing = true

        this.releaseCurrent(row)
        this.setNewState({...changedProperties, ...localChanges})
    }

    cancelEditing(state = this.state) {

        // 1. Инициализируем переменные
        const selection = {...state.selection, editing: false}
        const data = [...state.data]

        const row = this.copyDataRow(selection.row, data)
        const copy = row.$serv.copy

        const totalColumns = this.getColumns('totals')

        let dataGroups = state.dataGroups
        let dataGroupsCopied = false

        // Возвращаем итоговым колонкам значения до редактирования,
        //  которые при начале редактирования сохраняются в copy.$serv.parents
        if (totalColumns.length) {
            const parentData = copy.$serv.parents

            dataGroups = [...dataGroups]
            dataGroupsCopied = true

            for (let parentIndex in parentData) {
                const parentGroup = dataGroups[parentIndex - 1]

                parentGroup.values = parentData[parentIndex].values
                parentGroup.views = parentData[parentIndex].views
            }
        }

        if (row.$serv.isNew) {
            if(!dataGroupsCopied) {
                dataGroups = [...dataGroups]
            }
            this.removeRowFromGroup(dataGroups, data, row, selection, true)
        } else {
            for (let k in copy) row[k] = copy[k]
        }

        this.setNewState({dataGroups, data, selection})
    }

    finishEditing(selectionIn = null) {

        // 1. Получение данных
        let {settings, dataGroups, data, dataDefiner, filter, grouping: groups} = this.state

        const hasFilter = this.hasFilter()
        const rowValidation = settings && settings.rowValidation

        let selection = selectionIn || this.state.selection
        let row = data[selection.row - 1]

        // 2. Собираем изменившиеся поля, если ничего не изменилось,
        //  выходим из функции
        const {copy, isNew}  = row.$serv
        const changedFields = Object.keys(row).filter(f =>
            f !== '$serv' && (isNew || copy[f] !== row[f])
        )
        if(!changedFields.length) return {}

        // 3. Валидация
        const errors = this.checkValidation(row, rowValidation, dataDefiner)
        if(errors.length) {
            alert(errors.map(v=>v[1]).join('\n'))
            const errorColumn = errors.find(v => v[0])
            if(errorColumn) {
                this.setNewState({selection: {...selection, column: errorColumn[0]}})
            }
            return false
        }

        //
        let filtered = true
        if(hasFilter) {
            const rowCopy = this.copyDataRow(row)
            this.filterData({data: [rowCopy], filter})

            filtered = rowCopy.$serv.filtered
            if(!filtered && !confirm(`New data is not fit to current filter... 
                                        row will be hidden...continue?`)) {
                return false
            }
        }

        const {groupColumns, sortColumns, totalColumns} = this.getColumns(null, changedFields)

        // При наличии группировок новая строка помещается в неотображаемые временные группы
        // которые по окончании редактирования подлежать удалению
        const hasTempGroups = isNew && row.$serv.parent > 1

        const dataIsChanged =
            hasTempGroups
                || !filtered
                    || groupColumns.length
                        + sortColumns.length
                        + totalColumns.length

        if(dataIsChanged) {

            data        = [...data]
            dataGroups  = [...dataGroups]

            const changedData = {dataGroups, data}

            row = this.copyDataRow(row.$serv.index, data)
            if(!filtered) {
                row.$serv.filtered = false
            }

            const moveToAnotherGroup = groupColumns.length || isNew

            if(moveToAnotherGroup) {
                this.removeRowFromGroup(dataGroups, data, row)
                if(isNew) {
                    delete row.$serv.isNew
                }
                this.addRowToGroup(dataGroups, data, row)
            } else if (!filtered) {
                if(!selectionIn) {
                    changedData.selection = selection = {...selection}
                }
                this.removeRowFromGroup(dataGroups, data, row, selection, false, true)
            }

            if(!moveToAnotherGroup) {
                if(sortColumns.length) {
                    this.sortSingleItems(dataGroups, data, [row])
                }
                if(totalColumns.filter(c => c.sort).length) {
                    const parents = this.getParents(dataGroups, row)
                    this.sortSingleItems(dataGroups, data, parents)
                }
            }

            if(isNew) {
                delete row.$serv.isNew
            }

            this.releaseCurrent(row)
            return changedData
        }

        return {}
    }

    moveSelectionUpDown(direction, state = this.state) {

        let selection = state.selection

        if (!selection.row || selection.editing) return

        const {dataGroups, data} = state
        const rowIndex = selection.row

        const row = this.getRowByRef(rowIndex, dataGroups, data)
        const isGroup = row.childrenType

        const dataset = isGroup ? dataGroups : data
        const rowServ = isGroup ? row : row.$serv

        const parentIndex = rowServ.parent
        if(!parentIndex) return

        const parent = dataGroups[parentIndex - 1]
        const children = parent.children

        const range = typeof parent.show === 'object'
            ? parent.show
            : {from: 0, to: children.length - 1}

        let ind = rowServ.sortIndex + direction

        const hasFilter = this.hasFilter

        let nextRow
        while (!nextRow && ind >= range.from && ind <= range.to) {
            nextRow = dataset[children[ind] - 1]
            if(isGroup) {
                if(!nextRow.countFiltered) {
                    nextRow = undefined
                }
            } else {
                if(hasFilter && !nextRow.$serv.filtered) {
                    nextRow = undefined
                }
            }

            ind += direction
        }

        if(!nextRow) return

        const nextRowIndex = this.getUniqueIndex(nextRow)
        selection = {...selection, row: nextRowIndex}

        this.setNewState({selection})
    }

    changeTableValues(changeArr, justCount = true, newState = null, state = this.state) {

        if(!Array.isArray(changeArr)) {
            changeArr = [changeArr]
        }

        // 1. Определение переменных
        let {dataGroups, data, dataDefiner} = state

        if(!newState) {
            newState = {data: data = [...data]}
        }

        for(let change of changeArr) {

            let {column, row, value} = change
            const path = column.path

            const dependedColumnsPaths  = dataDefiner[path].depended
            const dependedViewsPaths    = dataDefiner[path].dependedViews

            // 2. Валидация
            const oldValue = row[path]

            let validationInfo

            ({value, info: validationInfo} = this.validateSingleValue(row, column, value))

            if (value === oldValue) return

            // 3. Копируем строку и присваиваем новое значение
            row = this.copyDataRow(row.$serv.index, data)
            row[path] = value

            // 4. Пересчитываем итоговые значения по колонке
            if (column.total) {
                newState.dataGroups = dataGroups = [...dataGroups]
                this.countTotals({dataGroups, data, row, column, oldValue, justCount})
            }

            // 5. Рассчитываем значения зависимых колонок если таковые имеются
            if (dependedColumnsPaths) {
                const dependedColumns = this.getColumns('all', dependedColumnsPaths)
                if (!newState.dataGroups && dependedColumns.find(c => c.total)) {
                    newState.dataGroups = dataGroups = [...dataGroups]
                }

                this.calculateDependedValues(dataGroups, data, dependedColumns, row, justCount)
            }

            // 6. Установим представления для самой колонки и для колонок,
            //  чье представление зависит от текущей
            const columnsWithViews = []
            if (column.format) {
                columnsWithViews.push(column)
            }

            if (dependedViewsPaths) {
                const dependedViewsColumns = this.getColumns('all', dependedViewsPaths)
                columnsWithViews.push(dependedViewsPaths)
            }

            if (columnsWithViews.length) {
                this.setRowViews(row, [column])
            }

            // 7. Освобождаем строку и устанавливаем состояние
            this.releaseCurrent(row)
        }

        this.setNewState(newState)

        const onValuesChangeHandler =
            this.props.handlers &&
            this.props.handlers.valuesChange

        if(onValuesChangeHandler) {
            setTimeout(onValuesChangeHandler.bind(this, changeArr), 0)
        }
    }

    setNewSortOrder(sort) {
        this.setNewState({sort})
    }

    calculateDependedValues(dataGroups, data, dependedColumns, row, justCount = false) {

        const totalColumns = dependedColumns.filter(c => c.total)
        let oldValues = [], hasTotals = totalColumns.length

        for (let column of dependedColumns) {

            const formula = column.field.formula
            if (!formula) continue

            const path = column.path
            const value = formula(row)

            if(hasTotals) {
                oldValues[path] = row[path]
            }
            row[path] = value
        }

        if(hasTotals) {
            this.countTotals({dataGroups, data, columns: totalColumns, row, oldValues, justCount})
        }

        const columnsWithView = dependedColumns.filter(c => c.format)
        this.setRowViews(row, columnsWithView)
    }

    countTotalsOnAddDelete(dataGroups, data, row, changedCount, hasFilter = this.hasFilter()) {

        const totalColumns = this.getColumns('totals')

        if (!totalColumns.length
            || changedCount > 0 && hasFilter && !row.$serv.filtered) {
                return
        }

        //Создадим копию строки
        const oldValues = this.copyDataRow(row)
        const newValues = this.copyDataRow(row)

        // Обнулим значения, влияющие на итоги у старых или новых значений
        // в зависимости от того, добавляется строка в группу или удаляется из нее
        const objToNull = changedCount > 0 ? oldValues : newValues
        totalColumns.forEach(c => objToNull[c.path] = null)

        // Вызываем функцию подсчета итогов
        this.countTotals({
            dataGroups,
            data,
            columns: totalColumns,
            row: newValues,
            oldValues,
            changedCount
        })
    }

    calculateRowValues(row, fields = null) {
        fields = fields || this.getCalculatedFields(this.state.dataDefiner)
        for (let field of fields) {
            row[field.path] = field.formula(row);
        }
    }

    setRowViews(row, columns, directly = true) {

        let views = row.childrenType ? row.views : row.$serv.views
        if(!directly) {
            if(row.childrenType) {
                views = row.views = {...views}
            } else {
                views = row.$serv = {...row.$serv, views: {...row.$serv.views}}
            }
        }

        const values = row.childrenType ? row.values : row

        let path, formatParam, value
        for (let column of columns) {
            ({path, formatParam} = column)
            value = values[path]

            views[path] = column.format(value, formatParam, values)
        }
    }

    // Validation

    checkValidation(row, rowValidation, dataDefiner) {

        let errors = [], res

        const columns = this.getColumns('all', null, true)

        const rowRules = this.getValidationRules('row')
        for (let column of columns) {

            if(!column.field || !column.field.validation) continue
            const path = column.path

            const validation = column.field.validation
            for (let rule of rowRules) {
                const [ruleName, ruleFunc] = rule

                if(ruleName in validation) {
                    res = ruleFunc(row[path], validation[ruleName], column.title)
                    if(res !== true) {
                        errors.push([path, res])
                    }
                }

            }
        }

        if(rowValidation) {
            res = rowValidation(row)
            if(Array.isArray(res) && res.length) {
                if(!Array.isArray(res[0])) {
                    errors.push(res)
                } else {
                    errors = [...errors, ...res]
                }
            }
        }

        return errors
    }

    validateSingleValue(row, column, value) {

        const {validation, type} = column.field
        if(!validation || !Object.keys(validation).length) {
            return {value}
        }

        const info = []
        let ruleInfo

        const validateRule = (f, param) => {
            ({value, ruleInfo} = f(value, param))
            if(ruleInfo) info.push(ruleInfo)
        }

        const validationRules = this.getValidationRules('column')

        for(let rule of validationRules) {
            const [ruleName, ruleFunc] = rule

            if(ruleName in validation) {
                validateRule(ruleFunc, validation[ruleName])
            }
        }

        for(let rule in validation) {
            if(typeof validation[rule] === 'function') {
                validateRule(validation[rule], row)
            }
        }

        return {value, info}
    }

    getValidationRules(type) {

        const rules =

            {
                'column':[
                    ['precision',

                        function (value, precision) {

                            let ruleInfo

                            const parts = ('' + value).split('.')

                            if (parts.length > 1) {
                                if (!precision) {
                                    parts.pop()
                                } else {
                                    let fraction = parts[1]
                                    if (fraction.length > precision) {
                                        parts[1] = fraction.substr(0, precision)
                                        ruleInfo = `only ${precision} digits after dot`
                                    }
                                }
                            }

                            value = +parts.join('.')

                            return {value, ruleInfo}
                        }
                    ],

                    ['length',
                        function (value, length) {

                            const ruleInfo = `length should not be more than ${length} digits`

                            const valueStr = '' + value
                            const diff = valueStr.length - length

                            if (diff <= 0) return {value}

                            const parts = valueStr.split('.')
                            parts[0] = parts[0].substr(0, parts[0].length - diff)

                            value = +parts.join('.')

                            return {value, ruleInfo}
                        }
                    ],

                    ['maxlength',

                        function (value, length) {

                            const ruleInfo = `max length is ${length}`

                            let diff = value.length - length
                            if (diff <= 0) return {value}

                            while (value[0] === ' ') {
                                diff--
                                value = value.substr(1)

                                if (!diff) return {value}
                            }

                            value = value.trim()
                            diff = value.length - length
                            if (diff > 0) value = value.substr(0, length)

                            if (diff < 0) value += ' '.repeat(-diff)

                            return {value, ruleInfo}
                        }
                    ],

                    ['positive',
                        function (value, param) {
                            let ruleInfo
                            if(value < 0) {
                                ruleInfo = 'Only positive numbers'
                                value = -value
                            }

                            return {value, ruleInfo}
                        }
                    ],
                ] // End column block
                ,

                'row': [
                    ['required',
                        function (value, param, column) {
                            if(value == false) {
                                return `${column} should not be empty`
                            }

                            return true
                        }
                    ],

                    ['range',
                        function (value, range, column) {
                            let rangeFrom, rangeTo

                            if(Array.isArray(range)) {
                                ([rangeFrom, rangeTo] = range)
                            } else {
                                ({rangeFrom, rangeTo} = range)
                            }

                            if(rangeFrom !== undefined && rangeFrom > value
                                || rangeTo !== undefined && rangeTo < value) {
                                    return `${column} should be in range ${rangeFrom}-${rangeTo}`
                            }

                            return true
                        }
                    ]
                ]
            }

        return rules[type]

    }

    /////////////////////////////////////
    // Menu options
    addRow(state = this.state) {

        // 1. Завершаем редактирование текущей строки, если таковая имеется
        //  Если строка не прошла валидацию, добавление новой не происходит
        const changedData = state.selection.editing
            ? this.finishEditing() : {}

        if(!changedData) return

        // 2. Иницируем переменные
        let {dataGroups, data, dataDefiner} = state
        dataGroups = changedData.dataGroups || [...dataGroups]
        data       = changedData.data || [...data]

        const newRowIndex   = data.length + 1

        const {columns, totalColumns, groupColumns}  = this.getColumns()
        const columnsWithView = columns.filter(c => c.format)

        // 3. Создаем строку и добавляем ее в массив данных
        const row = {
            $serv: {
                index: newRowIndex,
                views: {},
                isNew: true,
                isCurrent: 1,
            }
        }

        data.push(row)

        // 4. Устанавливаем значения по умолчанию
        for (let key in dataDefiner) {
            row[key] = dataDefiner[key].default
        }

        // 5. Рассчитываем значения для колонок с формулой
        //  и устанавливаем представления
        this.calculateRowValues(row)
        this.setRowViews(row, columnsWithView)

        // 6. Создаем группу для новой колонки
        this.addRowToGroup(dataGroups, data, row)

        const column = (this.firstEditableColumn() || {})['path']

        this.startEditing(state, {
            data,
            dataGroups,
            selection: {row: newRowIndex, column}
        })

        this.releaseCurrent(row)
    }

    deleteRow(askConfirm = true, state = this.state) {

        const CONFIRM_QUESTION = 'Row will be deleted...Please confirm action'

        let selection = {...state.selection}

        // При отсутствии выделенной строки или отсутствии подтверждения
        //  удаления со стороны пользователя выходим из процедуры
        if (isNaN(selection.row) || askConfirm && !confirm(CONFIRM_QUESTION)) {
            return
        }

        // Делаем копии состояний
        const dataGroups  = [...state.dataGroups]
        const data        = [...state.data]
        const row         = data[selection.row - 1]

        // Удаляем строку из группы
        this.removeRowFromGroup(dataGroups, data, row, selection, true)
        selection.editing = false

        //Устанавливаем конечное состояние
        this.setNewState({dataGroups, data, selection})
    }

    showHideSettings(state = this.state) {

        let currentScreen = state.currentScreen
        if(currentScreen !== 'settings') {
            this.setNewState({currentScreen: 'settings'})
        }
    }

    // OTHER FUNCTIONS

    checkIfIsDate(value) {
        return false
    }

    determineDataColumnType(data, path) {

        let type
        const till = Math.min(50, data.length)

        for(let i = 0; i < till; i++) {
            const value = data[i][path]
            if(value === null || value === undefined) continue

            let valueType = typeof value
            if(valueType === 'string') {
                type = this.checkIfIsDate(valueType) ? 'date' : 'string'
            }
            if(type === undefined) {
                type = valueType
            } else if(type !== valueType) {
                type = 'string'
            }
        }

        return type
    }

    aggFunction(name) {
        return $ETManager.aggFunctions[name]
    }

    copyDataRow(row, data = null) {

        if(typeof row === 'number') {
            row = data[row - 1]
        }

        let rowServ = row.childrenType ? row : row.$serv

        // Флаг isCurrent устанавливается, чтобы не терять ссылку
        // лишним копированием во вложенных функциях,
        // в таком случае просто возвращается существующая ссылка без копирования
        if(data && rowServ.isCurrent) {
            rowServ.isCurrent ++
            return row
        }

        if(row.childrenType) {
            row = {
                ...row,
                values  : {...row.values},
                views   : {...row.views},
                children: [...row.children],
            }

            rowServ = row
        } else {
            row = {...row}
            row.$serv = {
                ...row.$serv,
                views: {...row.$serv.views}
            }

            rowServ = row.$serv
        }

        if(data) {
            rowServ.isCurrent = 1
            data[rowServ.index - 1] = row
        }

        return row
    }

    releaseCurrent(row) {
        const rowServ = row.childrenType ? row : row.$serv
        rowServ.isCurrent --
        if(!rowServ.isCurrent) delete rowServ.isCurrent
    }

    filterFromString(filterString, dataDefiner) {

        if(!filterString) return {
            filters: [],
            hasFilter: false,
        }

        const fields = Object.keys(dataDefiner)
        const fieldsLowerCaseMap = {}

        for(let field of fields) {
            fieldsLowerCaseMap[field.toLowerCase()] = field
        }

        const regFunc = /(\!)?(isEmpty)\([_A-Za-zА-Яа-я][A-Za-zА-Яа-я0-9]*\)/
        const regCond = ''

        const parts = []
        while (filterString.indexOf('(') > 0) {
            filterString.replace(/\([^()]*\)/g, (expr) => {

                const exprArr = []

                const andParts = expr.split(/(\&\&)|( AND )|( and )|( И )|( и )/g)
                for(let i = 0; i < andParts.length; i++) {
                    const orParts = exprParts[i].split(/(\|\|)|( OR )|( or )|( ИЛИ )|( или )/g)
                    for(let j = 0; j < orParts.length; j++) {
                        const condition = {join: !j ? 'and' : 'or'}

                        const exprPart = orParts[j]
                        let res, fieldName

                        if(exprPart.match(regFunc)) {
                            const splited = exprPart.split('(')
                            condition.condition = splited[0]

                            fieldName = splited[1].split(')')[0]
                        } else if (res = exprPart.match(regCond)){

                            fieldName = res[0]
                            condition.condition = res[1]
                            condition.value = res[2]
                        }

                        fieldName = fieldsLowerCaseMap[fieldName.toLowerCase()]
                        if(!fieldName) {
                            //error !!!
                            continue
                        }

                        condition.field = fieldName
                        const field = dataDefiner[fieldName]

                        if('value' in condition) {
                            const value = condition.value
                            if(value[0] === '"' || value[0] === '\'') {
                                condition.value = value.substr(1, value.length - 1)
                            } else if(!isNaN(value)) {
                                condition.value = +value
                            }
                        }
                    }
                }

                return '$' + parts.push(exprArr) + '$'
            })
        }
    }

    hasFilter(filter = this.state.filter) {
        return filter.hasFilter
    }

    getRowByRef(rowIndex, dataGroups = this.state.dataGroups, data = this.state.data) {
        let dataSet
        if(typeof rowIndex === 'string' ) {
            dataSet = dataGroups
            rowIndex = rowIndex.substr(1)
        } else {
            dataSet = data
        }

        return dataSet[rowIndex - 1]
    }

    getGroupsLevels(dataGroups, levelsCount = 10) {

        const levels = []
        let i, group, level

        for (i = 0; i < levelsCount; i++) {
            levels.push([])
        }

        for (i = 0; i < dataGroups.length; i++) {
            group = dataGroups[i]
            level = group.level
            if (level > 10 && !levels[level]) {
                levels[level] = []
            }

            levels[level].push(group)
        }

        // Удалим лишние элементы
        while (!levels[levels.length - 1].length) levels.length--

        return levels
    }

    getParents(dataGroups, row) {

        const parents = []

        let parent = row
        let parentIndex = parent.childrenType
            ? parent.parent
            : parent.$serv.parent

        while (parentIndex) {
            parent = dataGroups[parentIndex - 1]
            parents.push(parent)

            parentIndex = parent.parent
        }

        return parents
    }

    getColumn(path) {
        const res = this.getColumns('all', [path], true)
        if(Array.isArray(res)) return res[0]
    }

    getColumns(types=null, paths=null, includeHiddenFields=false, state = this.state) {

        const {grouping, sorting, totals, filter} = state

        let columns = [...state.columns]
        let columnsFilter

        switch (types) {
            case 'sorting':
                columnsFilter = sorting.map(c=>c.path)
                break
            case 'grouping':
                columnsFilter = grouping.map(c=>c.path)
                break
            case 'totals':
                columnsFilter = Object.keys(totals)
                break
            default:
                columnsFilter = null
        }

        if(paths) {
            if(columnsFilter) {
                paths = new Set(paths)
                columnsFilter = columnsFilter.filter(v => paths.has(v))
            } else {
                columnsFilter = paths
            }
        }

        if(includeHiddenFields) {
            const columnsPaths = new Set(columns.map(c => c.path))
            const dataDefiner = state.dataDefiner
            for(let path in dataDefiner) {
                if(!columnsPaths.has(path)) {
                    columns.push({path: path, title: path, field: dataDefiner[path]})
                }
            }
        }

        if(columnsFilter) {
            columnsFilter = new Set(columnsFilter)
            columns = columns.filter(c => columnsFilter.has(c.path))
        }

        const filterMap = {}
        if(filter.hasFilter) {
            filter.filters.forEach(f => {
                filterMap[f.field] = f
            })
        }

        columns = columns.map(c => {

            const column = {...c, column: c}
            const totalFunc = totals[c.path]

            let ind

            if(totalFunc) {
                const aggFunction = this.aggFunction(totalFunc)
                column.total = {...aggFunction, name: totalFunc}
                column.hasView = column.format &&
                    (!aggFunction.type || aggFunction.type === column.field.type)
            }

            if(ind = sorting.findIndex(c => c.path === column.path) + 1) {
                column.sort = {index: ind, direction: sorting[ind - 1].direction}
            }

            if(ind = grouping.findIndex(c => c.path === column.path) + 1) {
                column.group = {level: ind}
            }

            if(c.path in filterMap) {
                column.filter = filterMap[c.path]
            }

            return column
        })

        const sortFunctions = {
                sorting    : (a, b) => a.sort.index - b.sort.index,
                grouping   : (a, b) => a.group.level - b.group.level
            },
            sortFunction = sortFunctions[types]

        if(sortFunction) columns.sort(sortFunction)

        if(types === null) {
            columns = {
                columns     : columns.map(c => c),
                sortColumns : columns.filter(c => c.sort).sort(sortFunctions.sorting),
                groupColumns: columns.filter(c => c.group).sort(sortFunctions.grouping),
                totalColumns: columns.filter(c => c.total),
            }
        }

        return columns
    }

    getColumnsMap(types='all', paths=null, includeHiddenFields=true) {
        const columns = this.getColumns(types, paths, includeHiddenFields)
        const columnsMap = columns.reduce((map, c) => {
            map[c.path] = c
            return map
        }, {})

        return columnsMap
    }

    findNextColumn(columnPath, direction, withControl = false) {

        const columns = this.state.columns
        let ind = columns.findIndex(c => c.path === columnPath)

        while((ind = ind + direction) || true) {

            if(ind < 0) ind = columns.length - 1
            else if(ind === columns.length) ind = 0

            if(!columns[ind].hidden && (columns[ind].control || !withControl)) break
        }

        return columns[ind]
    }

    getCalculatedFields(dataDefiner) {
        const calculated = []
        for(let path in dataDefiner) {
            if(dataDefiner[path].formula)
                calculated.push({...dataDefiner[path], path})
        }

        return calculated
    }

    getChildrenValues(groupRow, dataGroups, data, hasFilter = this.hasFilter()) {
        let retVal = [], row, rowServ
        const {childrenType, children} = groupRow
        if(childrenType === 1) {
            for(var i = 0; i < children.length; i++) {
                row = data[children[i] - 1]
                rowServ = row.$serv
                if(hasFilter && !rowServ.filtered || rowServ.deleted) continue

                retVal.push(row)
            }
        } else {
            for(var i = 0; i < children.length; i++) {
                row = dataGroups[children[i] - 1]
                if(!row.countFiltered) continue

                retVal.push({...row.values, ['@storage']: row.storage})
            }
        }

        return retVal
    }

    firstEditableColumn() {
        return this.state.columns.find(c => c.control && !c.hidden)
    }

    findFirstFiltered(data, parent, sortIndex, direction) {
        const children = parent.children

        const check = direction > 0
                ? v => v < children.length
                : v => v > -1

        const filtered = this.state.filter.filterFunction

        for(let i = sortIndex; check(i); i+=direction) {
            const index = children[i]
            if(!filtered || data[index - 1].$serv.filtered) {
                return index
            }
        }
    }

    getSimpleValue (row, column) {
        let value = row[column.path]
        if(typeof value === 'object') {
            let keyField = column.field.pk || Object.keys(value)[0]
            value = value[keyField]
        }

        return value
    }

    getUniqueIndex(row) {
        return row.childrenType ? 'g' + row.index : row.$serv.index
    }
    
    ////////////////////////////////
    // S e t t i n g s   f u n c t i o n s
    
    

    // RENDERING
    createHandlersMap() {
        let handlers = {}

        for(let i = 0; i < arguments.length; i++) {
            const handlerName = 'on'
                + arguments[i][0].toUpperCase()
                + arguments[i].substr(1)
                + 'Handler'

            handlers[arguments[i]] = this[handlerName].bind(this)
        }

        return handlers
    }

    // Перемена местами
    settingsMoveOrder(tableType, direction, context) {

        let {data, dataGroups, selection} = context.state
        if(!selection.row) return

        const rowIndex = selection.row
        const contextRow = data[rowIndex - 1]

        direction = direction === 'down' ? 1 : -1

        const swapIndex = dataGroups[0].children[contextRow.$serv.sortIndex + direction]
        if(!swapIndex) return

        let contextSwapRow = data[swapIndex - 1]

        const indexColumn = context.getColumn('index')

        const contextChangedValues = [
            {column: indexColumn, row: contextRow       , value: contextRow.index + direction},
            {column: indexColumn, row: contextSwapRow   , value: contextSwapRow.index - direction},
        ]

        const contextFunction = (function () {
            this.changeTableValues(contextChangedValues)
            this.sortData()
        }).bind(context)

        setTimeout(contextFunction, 0)

        //////////////////////////////////////////////////
        // Общая таблица

        data    = this.state.data
        const row     = data.find(r => r.path === contextRow.path)
        const swapRow = data.find(r => r.path === contextSwapRow.path)

        const columnPath = tableType + 'Index'
        const column = this.getColumn(columnPath)

        const changedValues = [
            {column, row: row       , value: row[columnPath] + direction},
            {column, row: swapRow   , value: swapRow[columnPath] - direction},
        ]

        const changeValuesFunction = (function () {
            this.changeTableValues(changedValues)
        }).bind(this)

        setTimeout(changeValuesFunction, 1)
    }

    triggerDataChangesForOtherTable(receiver, changedData, rowFilterFunc) {

        $ETManager.executeFunctionForTable(

            function (changedValuesArr, context) {

                const data = context.state.data

                changedValuesArr = changedValuesArr.map(v => ({
                    column:     context.getColumn(v.column),
                    row:        data.find(rowFilterFunc.bind(null, v)),
                    value:      v.value
                }))

                context.changeTableValues(changedValuesArr)
                const changedStates = context.filterData()
                context.setNewState(changedStates)
            }
            .bind(null, changedData),

            receiver
        )
    }

    // Функция добавляет справа от таблицы
    //  настроек таблицы сортировки и группировки
    getSortAndGroupSettingsTable(data, tableId) {

        // Определение колбэков
        //  moveOrderFunc - действие для кнопок перемещения,
        //  возможно имеет смысл сделать стандартным
        const moveOrderFunc = function (direction, context) {

            const {data, dataGroups, selection} = context.state
            if(!selection.row) return

            const row = data[selection.row - 1]

            const swapIndex = dataGroups[0].children[row.$serv.sortIndex + direction]
            if(!swapIndex) return

            const swapRow = data[swapIndex - 1]

            const column = context.getColumn('index')

            const changedValues = [
                {column, row: row    , value: row.index + direction},
                {column, row: swapRow, value: swapRow.index - direction},
            ]

            const changeValuesFunction = function(changedValues){
                this.changeTableValues(changedValues)
                this.sortData()
            }.bind(context, changedValues)

            setTimeout(changeValuesFunction, 0)
        }

        // Создаем данные для таблиц сортировки и группировки
        const datasets = {
            group:
                data.map(r => ({
                        use: r.group,
                        path: r.path,
                        title: r.title,
                        index: r.groupIndex
                    })),

            sort:
                data.map(r => ({
                        use: r.sort,
                        path: r.path,
                        title: r.title,
                        index: r.sortIndex,
                        direction: r.sortDirection
                    }))
        }

        const dataStates = {}, tables = {}

        // Устанавливаем настройки и создаем таблицы
        for(let dataType in datasets) {
            dataStates[dataType] = {
                settings: {
                    tableId: tableId + '_' + dataType + 'ing',
                    menu: {
                        mainLine: [
                            {title: '⇑', action: moveOrderFunc.bind(null, -1)},
                            {title: '⇓', action: moveOrderFunc.bind(null, +1)},
                        ]
                    },
                    title: <span className={'et-title'}>
                            {dataType[0].toUpperCase() + dataType.substr(1) + 'ing'}
                        </span>,
                    showHead: false,
                },

                data: datasets[dataType],
                columns: [{path: 'title', title: dataType, control: null}],
                sorting: 'index',
                filter: {
                    hasFilter: true,
                    filters: [
                        {field: 'use', condition: 'equal', value: true, use: 1},
                    ]
                }
            }

            const onValuesChangeHandler = function (changedValuesArray) {

                changedValuesArray = changedValuesArray
                    .filter(v => v.column.path !== 'use')
                    .map(v => ({
                        path: v.row.path,
                        column: dataType
                        + v.column.path[0].toUpperCase()
                        + v.column.path.substr(1),
                        value: v.value
                    }))

                if(!changedValuesArray.length) return

                const tableId = this.state.settings.tableId
                const receiverTableId = tableId.substr(0, tableId.length - dataType.length - 4)

                this.triggerDataChangesForOtherTable(
                    receiverTableId,
                    changedValuesArray,
                    function (v, r) {return r.path === v.path}
                )
            }
            const handlers = {valuesChange: onValuesChangeHandler}

            tables[dataType] =
                <EditableTable
                    state={dataStates[dataType]}
                    handlers={handlers}
                />
        }

        // Для таблицы сортировки добавляем колонку направления сортировки
        dataStates.sort.columns.push({
            path: 'direction',
            type: 'enum',
            values: [
                {value: 1, view: 'Asc'},
                {value: 2, view: 'Desc'},
            ]
        })

        return tables
    }

    getSettingsEditor() {

        const columns = this.getColumns('all', null, true)
        const settings = this.state.settings

        // 1. Получаем таблицу редактирования настроек,
        //  каждая колонка таблицы данных - строка в таблице настроек
        const editorData = columns.filter(c => c.field).map(c => ({
            path: c.path,
            title: c.title,

            // Сортировка
            sort: !!c.sort,
                sortIndex: c.sort ? c.sort.index : 0,
                    sortDirection: c.sort ? c.sort.direction : 1,

            //Группировка
            group: !!c.group,
                groupIndex: c.group ? c.group.level : 0,

            // Итоги
            total: c.total,

            // Фильтрация
            filter_use: c.filter ? c.filter.use : false,
                filter_condition: c.filter ? c.filter.condition : null,
                    filter_value: c.filter ? c.filter.value : null,
                        filter_value2: c.filter ? c.filter.value2 : null,

            // Ссылка на колонку
            column: c,
        }))

        const defaultControlsMap = $ETManager.defaultControlsMap

        const tableId = settings.tableId + '__settingsEditor'

        // Получим массив условий отбора
        const conditionTypes = $ETManager.constants.conditions
        const filterConditions = $ETManager.filterConditions.map(
            cond => ({value: cond.name, view: cond.view})
        )

        // Функция определения типа данных для строки настройки колонки
        //  будет вызываться для определения типа элемента управления
        const typeDefineFunc = (row) => {
            if (!row.path) return {};

            const column = columnsMap[row.path]

            const properties = ['type', 'length', 'precise', 'values', 'source', 'isArray']
            const typeDefine = properties.reduce(
                (obj, property) => {obj[property] = column.field[property]; return obj},
                {}
            )

            return typeDefine
        }

        // Функция определения типа элемента управления
        const controlDefineFunc = (row) => {
            if (!row.path) return null

            let control = columnsMap[row.path].control
            if(!control) {
                const type = typeDefineFunc(row).type
                if (type) {
                    control = defaultControlsMap[type] || type
                }
            }

            return control
        }

        // Функция определения типа элемента управления для второго поля сравнения,
        //  используемого при условии in range
        const controlDefineFunc2 = (row) => {
            const condition = row.filter_condition
            if(condition !== conditionTypes.IN_RANGE
                && condition !== conditionTypes.NOT_IN_RANGE) {
                return null
            }

            return controlDefineFunc(row)
        }

        // Определение колонок
        const settingsColumns = [
            {path: 'title', title: 'Field', control: null},
            {path: 'sort', type: 'boolean'},
            /*{path: 'sortIndex', type: 'number-3-0'},
            {
                path: 'sortDirection',
                type: 'number',
                format: (v, _, row) => row.sort ? [,'Возр', 'Убыв'][v] : ''
            },*/
            {path: 'group', type: 'boolean'},
            /*{path: 'groupIndex', type: 'number-3-0'},*/

            {path: 'total', type: 'boolean'},
            {
                path: 'filter_use',
                title: 'filter',
                type: 'boolean'
            },
            {
                path: 'filter_condition',
                title: 'condition',
                type: 'enum',
                values: filterConditions
            },
            {
                path: 'filter_value',
                title: 'value',
                type: typeDefineFunc,
                control: controlDefineFunc
            },
            {
                path: 'filter_value2',
                title: 'to',
                type: typeDefineFunc,
                control: controlDefineFunc2
            },
        ]

        const compareAndSaveSettingsFunc = this.compareAndSaveSettings

        const actionSaveSettings = function (cancelMode, context) {

            const data = context.state.data

            let newData
            if(!cancelMode) {
                const grouping =
                    data
                        .filter(r => r.group)
                        .sort((a, b) => a.groupIndex - b.groupIndex)
                        .map(r => ({
                            path: r.path,
                        }))

                const sorting =
                    data
                        .filter(r => r.sort)
                        .sort((a, b) => a.sortIndex - b.sortIndex)
                        .map(r => ({
                            path: r.path,
                            direction: r.sortDirection
                        }))

                const totals =
                    data.reduce(
                        (totals, r) => {
                            if(r.total) totals[r.path] = r.total
                            return totals
                        },
                        {}
                    )

                const filter =
                    data
                        .filter(r => r.filter_condition)
                        .map(r => ({
                            use: r.filter_use,
                            field: r.path,
                            condition: r.filter_condition,
                            value: r.filter_value,
                            value2: r.filter_value2
                        }))

                newData = {sorting, grouping, totals, filter}
            }

            const receiverTableId = context.state.settings.tableId
            $ETManager.executeFunctionForTable(compareAndSaveSettingsFunc, receiverTableId, 0)
        }

        // Устанавливаем начальное состояние из сформированных выше данных
        const settingsState = {
            settings: {
                tableId,
                menu: {
                    mainLine: [
                        {title: 'OK'    , action: actionSaveSettings.bind(null, false)},
                        {title: 'Cancel', action: actionSaveSettings.bind(null, true)},
                    ]
                },
            },
            data: editorData,
            columns: settingsColumns,
        }

        const onGroupSortChangeHandler = function (changedValuesArray) {

            for(let dataType of ['group', 'sort']) {

                const changedData = changedValuesArray
                    .filter(v => v.column.path === dataType)
                    .map(v => ({
                        path    : v.row.path,
                        column  : 'use',
                        value   : v.value
                    }))

                const length = changedData.length
                if(!length) continue

                const indexColumnPath = dataType + 'Index'
                let maxIndex = this.state.data.reduce(
                    (maxInd, r) => Math.max(r[indexColumnPath], maxInd)
                    , 0
                )

                for(let i = 0; i < length; i++) {
                    changedData.push({
                        path    : changedData[i].path,
                        column  : 'index',
                        value   : ++maxIndex,
                    })
                }

                const receiverTableId = `${tableId}_${dataType}ing`

                this.triggerDataChangesForOtherTable(
                    receiverTableId,
                    changedData,
                    function (v, r) {return r.path === v.path}
                )
            }
        }
        const handlers = {valuesChange: onGroupSortChangeHandler}

        // устанавливаем элемент
        const settingsTable = <EditableTable
            state={settingsState}
            handlers={handlers}
        />

        // Получаем таблицы сортировки и группировки
        const {sort: sortTable, group: groupTable} = this.getSortAndGroupSettingsTable(editorData, tableId)

        // Возвращаем в рендер-функцию созданный массив элементов
        return [
            <div key={'settings'} style={{display: 'inline-block'}}>
                {settingsTable}
            </div>,
            <hr/>,
            <div key={'group-sort'} style={{display: 'inline-block', verticalAlign: 'top', paddingLeft: '20px'}}>
                {groupTable}
                {sortTable}
            </div>
        ]

        return settingsTable
    }

    render() {

        // Собираем хэндлеры событий для передачи в дочерние элементы таблицы
        const handlers = this.createHandlersMap(
            'click', 'valueChange', 'dblClick', 'menuItemClick', 'keyUp', 'columnClick',
            'refreshData'
        )

        // Чтение состояний
        const {dataGroups, data, settings, selection, pagination = {}, currentScreen = 'table'}
            = this.state

        // Чтение настроек
        const {menu, tableId, renderTableFunction} = settings

        let screenElements

        if(currentScreen === 'table') {

            console.table(data)

            const hasFilter = this.hasFilter()
            const paginationIndex = pagination.count ? pagination.index : null

            const {columns, groupColumns} = this.getColumns()

            const tableParts = []
            if(settings.showHead !== false) {
                tableParts.push(
                    <Columns columns={columns} handlers={handlers} groups={groupColumns}/>
                )
            }
            tableParts.push(
                <Rows
                    settings={settings}
                    columns={columns}
                    dataGroups={dataGroups}
                    data={data}
                    selection={selection}
                    handlers={handlers}
                    groups={groupColumns}
                    hasFilter={hasFilter}
                    paginationIndex={paginationIndex}
                />
            )

            const titleElement = settings.title
            const menuElement = <Menu menu={menu} handlers={handlers}/>
            const tableElement = <table ref="t" id={tableId} key={tableId} className="editable-table">
                {tableParts}
            </table>

            screenElements = [
                menuElement,
                tableElement
            ]

            if(titleElement) {
                screenElements.unshift(titleElement)
            }

            // Если в settings определена функция рендеринга
            //  передаем в нее элементы
            if(renderTableFunction) {
                screenElements = renderTableFunction.bind(this)({
                    title: titleElement,
                    menu: menuElement,
                    table: tableElement
                }, screenElements)
            }
        } else {
            // Редактирование настроек таблицы
            screenElements = this.getSettingsEditor()
            /*screenElements = <SettingsEditor
                settings={settings}
                columns={allColumns}
                renderTableFunction={this.settingsRenderAdditionalFunction}
            />*/
        }

        const containerClassName = 'table-container ' + tableId

        return (
            <div className={containerClassName}>
                {screenElements}
            </div>
        )


    }
}

class SettingsEditor extends React.Component {

    constructor(props) {

        super(props)

        const {settings, columns} = this.props

        const data = columns.filter(c => c.field).map(c => ({
            path: c.path,
            title: c.title,
            sort: !!c.sort,
            sortIndex: c.sort ? c.sort.index : 0,
            sortDirection: c.sort ? c.sort.direction : 0,
            group: !!c.group,
            groupIndex: c.group ? c.group.level : 0,
            total: c.total,
            filter_condition: c.filter ? c.filter.condition : null,
            filter_value: c.filter ? c.filter.value : null,
            filter_value2: c.filter ? c.filter.value2 : null,
            filter_use: c.filter ? c.filter.use : false,
            column: c,
        }))

        this.state = {data}

    }

    render() {

        const {settings, columns} = this.props

        const columnsMap = columns.reduce(
            (map, c) => {map[c.path] = c; return map},
            {}
        )

        const defaultControlsMap = $ETManager.defaultControlsMap

        const tableId = settings.tableId + '__settingsEditor'

        const conditionTypes = $ETManager.constants.conditions
        const filterConditions = $ETManager.filterConditions.map(
            cond => ({value: cond.name, view: cond.view})
        )

        const typeDefineFunc = (row) => {
            if (!row.path) return {};

            const column = columnsMap[row.path]

            const properties = ['type', 'length', 'precise', 'values', 'source', 'isArray']
            const typeDefine = properties.reduce(
                (obj, property) => {obj[property] = column.field[property]; return obj},
                {}
            )

            return typeDefine
        }

        const controlDefineFunc = (row) => {
            if (!row.path) return null

            let control = columnsMap[row.path].control
            if(!control) {
                const type = typeDefineFunc(row).type
                if (type) {
                    control = defaultControlsMap[type] || type
                }
            }

            return control
        }

        const controlDefineFunc2 = (row) => {
            const condition = row.filter_condition
            if(condition !== conditionTypes.IN_RANGE
                && condition !== conditionTypes.NOT_IN_RANGE) {
                    return null
            }

            return controlDefineFunc(row)
        }

        const settingsColumns = [
            {path: 'title', title: 'Field', control: null},
            {path: 'sort', type: 'boolean'},
            {path: 'sortIndex', type: 'number-3-0'},
            {path: 'group', type: 'boolean'},
            {path: 'groupIndex', type: 'number-3-0'},
            {path: 'sortDirection', type: 'enum', values: [
                {value: 1, view: 'Возр'},
                {value: 2, view: 'Убыв'}
            ]},
            {path: 'total', type: 'boolean'},
            {
                path: 'filter_use',
                title: 'filter',
                type: 'boolean'
            },
            {
                path: 'filter_condition',
                title: 'condition',
                type: 'enum',
                values: filterConditions
            },
            {
                path: 'filter_value',
                title: 'value',
                type: typeDefineFunc,
                control: controlDefineFunc
            },
            {
                path: 'filter_value2',
                title: 'to',
                type: typeDefineFunc,
                control: controlDefineFunc2
            },
        ]

        const renderTableFunction = this.props.renderTableFunction

        const settingsState = {
            settings: {tableId, renderTableFunction},
            data: this.state.data,
            columns: settingsColumns,
            groupingBlockSelection: 0,
            sortingBlockSelection: 0,
        }


        const settingsTable = <EditableTable
            state={settingsState}
        />

        return settingsTable
    }
}

// ******* HEAD COMPONENTS *****
class Menu extends React.Component {
    render() {
        const {menu = {}, handlers} = this.props

        let mainLine = null

        if(menu.mainLine) {
            mainLine =
                <nav className="main-line">
                    {menu.mainLine.map((item, ind) =>
                        <button className="table-menu-item"
                                onClick={handlers.menuItemClick.bind(null, item)}
                                key={ind}>
                            {item.title || item.action}
                        </button>
                    )}
                </nav>
        }

        return <div className="menu-container">{mainLine}</div>
    }
}

class Columns extends React.Component {
    render() {

        const {handlers, groups, columns} = this.props

        const groupColumn = columns.find(c => c.path === '@group')
        if(groupColumn) {
            groupColumn.hidden = !groups.length
            if(!groupColumn.hidden){
                groupColumn.title = groups.map(group => group.title).join(' / ')
            }
        }

        const columnsArr = columns
            .filter(c => !c.hidden)
            .map(column =>
                <Column column={column} handlers={handlers} key={column.path}/>
            )

        return <thead><tr>{columnsArr}</tr></thead>
    }
}

class Column extends React.Component {
    render() {
        const {column, handlers} = this.props,

            styles = {
                column: {position: 'relative', padding: '2px 15px 2px 2px'},
                arrows: {position: 'absolute', right: 0, bottom: 0}
            }

        let className = 'column-header',
            sortSignElement

        if(column.sort) {

            const sortDirection = column.sort.direction < 0 ? 'desc' : 'asc',
                  sortArrows    = {desc: '⇓', asc: '⇑'}

            className += ' sort-' + sortDirection

            sortSignElement =
                <span className="sort-sign" style={styles.arrows}>
                    {sortArrows[sortDirection]}
                </span>
        }

        return <th key={column.path}
                        style={styles.column}
                            data-path={column.path}
                                className={className}
                                    onClick={handlers.columnClick}>
                       {column.title}{sortSignElement}
                </th>
    }
}

// ******** ROW COMPONENTS *******

class Rows extends React.Component {

    renderTree(param) {

        let {row, dataGroups, data, rows,
            groupStyles, columns, groups, selection, hasFilter,
            showControlsSet, showControlsMode, showControlModes,
            handlers, serial = ''} = param

        let isGroup = row.childrenType
        if (isGroup) {
            if (row.isNew || !row.countFiltered) {
                return
            }
        } else if (hasFilter && !row.$serv.filtered) {
            return
        }

        const rowKey          = isGroup ? 'g' + row.index : row.$serv.index
        const rowSelection    =
            rowKey === selection.row
                ? selection.column || '@all'
                : null

        let style = {}

        let showControls = new Set
        if(isGroup) {
            style = groupStyles[row.level]
        } else {
            showControls = showControlsSet
            if(rowSelection && selection.editing) {
                showControls = new Set(showControls)
                if(showControlsMode === showControlModes.SELECTED_LINE) {
                    columns
                        .filter(c => c.path[0] !== '@')
                        .forEach(c => showControls.add(c.path))
                } else {
                    showControls.add(rowSelection)
                }
            }
        }

        const rowElement = <Row
            rowKey={rowKey}
            serial={serial}
            row={row}
            columns={columns}
            style={style}
            selection={rowSelection}
            showControls={showControls}
            handlers={handlers}
        />

        if(row.parent) rows.push(rowElement)

        if(isGroup && !row.isClosed) {

            let children = row.children
            if (row.show !== true) {
                children = children.slice(row.show.from, row.show.till - row.show.from + 1)
            }

            const dataSet = row.childrenType === 1 ? data : dataGroups

            children.forEach((childIndex, i) =>
                this.renderTree(
                    {
                        ...param,
                        row     : dataSet[childIndex - 1],
                        serial  : serial + (serial ? '.' : '') + (i + 1)
                    }
                )
            )
        }

        if(!row.parent && !row.hidden) rows.push(rowElement)
    }

    render() {

        const {settings, dataGroups, data, groups, hasFilter, selection, handlers} = this.props
        const columns = this.props.columns.filter(c => !c.hidden)

        const {showControlModes} = $ETManager.constants

        const groupStyles = [
                {backgroundColor: '#999999', fontSize: 16, fontWeight: 'bold'},
                {backgroundColor: '#AAAAAA', fontSize: 14, fontWeight: 'bold'},
                {backgroundColor: '#BBBBBB', fontSize: 14, fontWeight: 'bold', fontStyle: 'italic'},
            ]

        groups.forEach((column, ind) =>
            Object.assign(groupStyles[ind + 1], column.groupStyle || {})
        )

        const rows = []
        const renderingObjects = []

        /*console.log(selection)
        console.log(columns)
        console.log(data)
        console.log(dataGroups)*/

        renderingObjects.push(dataGroups[0])

        if(groups && data.length) {
            const lastRow = data[data.length - 1]
            if(lastRow.$serv.isNew) {
                renderingObjects.push(lastRow)
            }
        }
        
        let showControlsArr = columns
        if(settings.showControlsMode !== showControlModes.ALWAYS) {
            showControlsArr = showControlsArr.filter(c => c.showAlways)
        }

        let showControlsSet = new Set(showControlsArr.map(c => c.path))

        let total
        for(let renderingObject of renderingObjects) {
            this.renderTree(
                {
                    row: renderingObject,
                    dataGroups,
                    data,
                    rows,
                    groupStyles,
                    columns,
                    groups,
                    selection,
                    hasFilter,
                    showControlsSet,
                    showControlsMode: settings.showControlsMode,
                    showControlModes,
                    handlers: this.props.handlers
                }
            )

            if(!total && !dataGroups[0].hidden) {
                total = rows.pop()
            }
        }

        if(total) rows.push(total)

        return <tbody onDoubleClick={handlers.dblClick}>
                    {rows}
                </tbody>
    }
}

class Row extends React.Component {
    render() {

        const {rowKey, serial, row, columns, selection, style, showControls, handlers} = this.props

        let rowClass = selection ? 'selected' : ''

        const elements        =
            columns.map(column => {

                const path = column.path

                let cellMode = 0
                if(showControls.has(path)) {
                    cellMode = 2 // SHOW CONTROL
                } else if (selection === path) {
                    cellMode = 1 // SELECT CELL
                }

                let view
                if(path === '@serial') {
                    view = serial
                }

                //const cellGroupColumn = path === '@group' ? groupColumn : null

                return <Cell row={row}
                             column={column}
                             key={path}
                             view={view}
                             cellMode={cellMode}
                             handlers={handlers} />
            })

        const rowElement = <tr style={style} className={rowClass} key={rowKey}>
            {elements}
        </tr>

        return rowElement
    }
}

class Cell extends React.Component {

    onClickHandler(event) {
        if(!event.target.classList.contains('open-close-button'))
            this.props.handlers.click(this.props.row, this.props.column)
    }

    render() {

        const {row, column, groupColumn, cellMode, handlers, view} = this.props

        const tdStyle   = {
            textAlign: column.align || 'left'
        }

        const className = ['', 'selected', ''][cellMode]

        let cellContent
        if(cellMode === 2) {
            let columnProp = column

            if(typeof columnProp.control === 'function') {
                columnProp.control = columnProp.control(row)
            }

            if(typeof columnProp.field.type === 'function') {
                const typeProperties = columnProp.field.type(row)
                columnProp.field = {...columnProp.field, ...typeProperties}
            }

            cellContent = <CellControl
                    row={row}
                    column={columnProp}
                    handlers={handlers} />

        } else {
            cellContent = <CellView
                row={row}
                column={column}
                view={view}
                handlers={handlers} />
        }

        const cellElement =
            <td style={tdStyle}
                    className={className}
                        onClick={this.onClickHandler.bind(this)}
                            key={column.path}
                                data-key={column.path}>
                {cellContent}
            </td>

        return cellElement

    }
}

class CellView extends React.Component {

    componentDidMount() {

        const column = this.props.column

        if(column.path.startsWith('@')
            || column.width
            || column.calculatedWidth) return

        const cell = ReactDOM.findDOMNode(this.refs.view).parentElement
        column.column.calculatedWidth = cell.clientWidth - cell.style.marginLeft
    }

    onOpenCloseClick() {
        this.props.row.isClosed = this.props.row.isClosed ? 0 : 1
        this.props.handlers.refreshData()
    }

    render() {

        let {row, column, groupColumn, view} = this.props
        let path = column.path

        let openCloseElement

        const style = {}

        if(path === '@group') {
            if(row.childrenType && row.groupPath) {
                const openCloseSign = row.isClosed ? '✚' : '—'

                openCloseElement =
                    <span className="open-close-button"
                          onClick={this.onOpenCloseClick.bind(this)}>
                        {openCloseSign}
                    </span>

                style.paddingLeft = 5 + (row.level - row.rootShow) * 10

            } else {
                view = ''
            }
        } else if(row.childrenType && !view) {
            if(!(path in row.values))  view = ''
        }

        if(view === undefined) {
            let views, values
            if(row.childrenType) {
                ({views, values} = row)
            } else {
                values = row
                views = row.$serv.views
            }

            view = path in views ? views[path] : values[path]
        }

        const viewElement =
            <span ref='view' style={style} className="cell-view">
                {openCloseElement}{view}
            </span>

        return viewElement
    }
}

class CellControl extends React.Component {

    constructor(props) {

        super(props)
        this.onValueChange      = this.onValueChange.bind(this)
        this.onListItemClick    = this.onListItemClick.bind(this)

        const column            = this.props.column

        const choiceList        = column.control === 'select' ? column.field.values : []
        const showChoiceList    = false

        let refText, selected
        
        this.state = {choiceList, showChoiceList, refText, selected}
    }

    componentDidMount() {

        const control = ReactDOM.findDOMNode(this.refs.control)
        const column  = this.props.column

        const controlWidth =  column.calculatedWidth -
                    (column.control === 'reference' ? 4 : control.offsetLeft * 2)

        control.style.width     = controlWidth + 'px'
        control.style.height    = (25 - control.offsetTop) + 'px'

        const focusedTags = ['INPUT', 'SELECT', 'TEXTAREA']
        const input       = focusedTags.includes(control.tagName)
                                ? control
                                : control.querySelector(focusedTags.join(','))

        if(input) {
            input.focus()
            if(input.tagName !== 'SELECT') {
                input.select()
            }
        }
    }

    onValueChange(value) {
        const {row, column} = this.props
        if(column.field.type === 'number') {
            value = isNaN(value) ? 0 : +value
        }
        this.props.handlers.valueChange(row, column, value);
    }

    onListItemClick(param) {

        const {control, searchFields} = this.props.column

        const isSelect      = control === 'select'
        const isReference   = control === 'reference'

        if(!isSelect && !isReference) {
            return
        }

        const valueIndex = typeof param === 'number'
                            ? param
                            : param.target.dataset.ind

        const choiceList  = this.state.choiceList

        let choice = choiceList[valueIndex]
        if(isSelect) choice = choice.value

        const state = {showChoiceList: false}
        if(isReference) {
            state.refText = this.getReferenceFieldText(choice, searchFields)
        }

        this.setState(state)
        this.onValueChange(choice)
    }

    onKeyDownHandler(event) {

        const ARROW_UP = 'ArrowUp', ARROW_DOWN = 'ArrowDown'
        const TYPE_REFERENCE = 'reference'

        const {keyCode, key} = event
        const selectLikeControl = event.target.classList.contains('select')

        let preventDefault = true

        if (selectLikeControl && (key === ARROW_UP || key === ARROW_DOWN)) {

            const controlType = this.props.control
            const {choiceList, showChoiceList} = this.state

            // Изменение ткущего элемента списка выбора
            if(showChoiceList || controlType === TYPE_REFERENCE) {

                let selected = this.state.selected + (key === ARROW_UP ? -1 : 1)
                const sourceLength = choiceList.length

                if(selected < 0) {
                    selected = sourceLength - 1
                } else if(selected === sourceLength) {
                    selected = 0
                }

                this.setState({selected: selected})

            } else if(key === ARROW_DOWN) {
                // Открываем список выбора
                this.setState({
                    showChoiceList: true,
                    selected: undefined,
                })
            }
        } else if(selectLikeControl && key === 'Enter') {
            if(this.state.showChoiceList) {
                event.stopPropagation()
                this.onListItemClick(this.state.selected)
            } else {
                $ETManager.sendKeyUp({keyCode, key}, 'select', 500)
            }
        } else if (key !== 'Tab') {
            preventDefault = false
        }

        if(preventDefault) event.preventDefault()
    }

    onRefInputKeyUpHandler(event) {

        const value = event.target.value
        const valueLowerCase = value.toLowerCase()

        const choiceList = []

        const column = this.props.column
        const values = column.field.values

        if(Array.isArray(values) && values.length) {

            const searchFields = column.searchFields || ['name']

            let search

            for (let obj of values) {
                //obj.$search содержит значения полей поиска, по умолчанию это name
                search = obj.$search ||
                    (obj.$search = searchFields.map(
                        v => ('' + obj[v]).toLowerCase()
                    ))

                // Ищем с начала строки
                if(search.find(v => v.indexOf(valueLowerCase) === 0)) {
                    choiceList.push(obj)
                }
            }
        }

        this.setState(
            {
                choiceList,
                refText: event.target.value,
                showChoiceList: true,
                selected: 0
            }
        )
    }

    getReferenceFieldText(value, searchFields) {
        if(!value) return '';

        searchFields = searchFields || ['name']
        return searchFields.map(f => value[f]).join(' ')
    }

    render() {
        const {column, row}   = this.props

        let value = row[column.path]

        let control = null
        let controlStyle = {}

        if(column.control === 'select') {

            const {showChoiceList, choiceList}  = this.state

            const selectClass = this.state.showChoiceList ? 'list_is_open' : ''

            const optionsList =
                    [{value: '', view: '- select -'}]
                    .concat(column.field.values)
                    .map(v => {
                        const value = v.value || v
                        const view  = v.view || value

                        return (<option value={value}>{view}</option>)
                    })

            const choiceListElem = showChoiceList
                && choiceList.map((v, ind) => {
                    const view = v.view || v.value
                    const className = ["list-item"]

                    const selectedItem = this.state.selected
                    if(selectedItem === undefined
                        && (v.value === value || !value && !ind)
                        || selectedItem === ind) {
                            className.push('selected')
                            if(selectedItem === undefined) this.state.selected = ind
                    }

                    return column.listItem ||
                        <div className={className.join(' ')} data-ind={ind}>{view}</div>
                }) || null

            const controlValue = value || ''

            control =
                <div ref="control" className={selectClass} style={{position: 'relative'}}>

                    <select className="select enum"
                            value={controlValue}

                            onKeyDown={this.onKeyDownHandler.bind(this)}
                            onChange={e => this.onValueChange(e.target.value)}>
                        {optionsList}
                    </select>

                    <div className="list-container"
                            onClick={this.onListItemClick.bind(this)}>
                        {choiceListElem}
                    </div>

                </div>

        } else if (column.control === 'reference') {

            const {showChoiceList, choiceList}  = this.state

            if(this.state.refText === undefined)
                this.state.refText = this.getReferenceFieldText(value, column.searchFields)

            // Если нет выделения, выделим первый жлемент списка
            if(isNaN(this.state.selected)) {
                this.state.selected = 0
            }

            const {selected, refText} = this.state

            const choiceListElem = showChoiceList ?
                <div className="list-container" onClick={e => this.onListItemClick(e.target)}>
                    {choiceList.map((v, ind) => {

                        const className = 'list-item' + (ind === selected ? ' selected' : '')
                        const view      = column.format(v, column.formatParam)

                        return column.listItem ||
                            <div className={className} data-ind={ind}>{view}</div>
                    })}
                </div> : null

            control =
                <div ref="control" style={{position: 'relative'}}>
                    <input className="select model" value={refText}
                           style={{width: '100%'}}
                           onKeyDown={this.onKeyDownHandler.bind(this)}
                           onChange={this.onRefInputKeyUpHandler.bind(this)}>

                    </input>

                    {choiceListElem}
                </div>;

        } else {
            controlStyle.textAlign = 'left';
            if(column.control === 'number') controlStyle.textAlign = 'right';

            let defaultChecked = column.control === 'checkbox' && value;

            control =
                <input ref="control" style={controlStyle} type={column.control} value={value}
                       onKeyDown={this.onKeyDownHandler.bind(this)}
                       onChange={e=>this.onValueChange(
                           e.target.type === 'checkbox' ? e.target.checked : e.target.value)}
                       defaultChecked={defaultChecked}
                />
        }
        return control
    }
}

//////////////////////////////////////////////////
// COMMON FUNCTIONS //////////////////////////////

function findParentOrThis(target, tag) {

    let parent = target;

    if(tag[0] === '.'){
        let className = tag.substr(1);
        while (parent && !parent.classList.contains(className)) {
            parent = parent.parentElement;
        }

        return parent;

    } else {
        let tagName = tag.toUpperCase(tag);

        while (parent && parent.tagName !== tagName){
            parent = parent.parentElement;
        }

        return parent;
    }
}

//////////////////////////////////////////////////////////
// TEST INIT //////////////////////////////////////////////

const tableTest = {
    settings: {
        tableId: 'testTable',
        dataType: 'model.Person',
        menu: {
            mainLine: [
                {action: 'Add'},
                {action: 'Delete'},
                {action: 'Settings'},
            ]
        },
        rowValidation: function (row) {
            if(row.weight === 66) {
                return [['weight', 'weight should not be 66 kg']]
            }

            return true
        }
    },
    columns: [
        '@serial',
        'name',
        'birthday',
        {path: 'age', format: '${@v} y.o.'},
        'weight',
        'gender',
        'country',
        'checked'
    ],

    sorting: 'country,age',
    grouping: 'gender,country',
    totals: 'age max',

    data: [
        {id: 1, name: 'Elvis', birthday: '1980-07-17', weight: 77, gender: 'male', country_id: 3, country: {id: 3, name: 'France'}, checked: 1},
        {id: 2, name: 'Michelle', birthday: '1998-03-22', weight: 54, gender: 'female', country_id: 2, country: {id: 2, name: 'Italy'}, checked: 0},
        {id: 3, name: 'Arnold', birthday: '1965-11-04', weight: 82, gender: 'male', country_id: 1, country: {id: 1, name: 'Argentina'}, checked: 1},
        {id: 4, name: 'Victor', birthday: '1975-11-18', weight: 71, gender: 'male', country_id: 3, country: {id: 3, name: 'France'}, checked: 0},
        {id: 5, name: 'Gabriela', birthday: '1987-03-25', weight: 68, gender: 'female', country_id: 1, country: {id: 1, name: 'Argentina'}, checked: 0},
    ],

    dataDefiner: {
        id          : 'pk',
        name        : 'string-10',
        birthday    : {type: 'date', default: '1980-01-01'},
        weight      : {
            type: 'number-3-0-required-positive',
            validation: {
                range: [15, 150]
            },
        },
        gender      : {type: 'enum', values: ['male', 'female']},
        country_id  : {type: 'number', formula: data => data.country ? data.country.id : null},
        country     : {type: 'model.countries', nosend: 1, values: [
                {id: 1, name: 'Argentina'},
                {id: 2, name: 'Italy'},
                {id: 3, name: 'France'},
                {id: 4, name: 'Brazil'},
                {id: 5, name: 'Austria'},
                {id: 6, name: 'Belgium'},
            ]},
        checked     : 'boolean',
        age         : {
            type: 'number-3-0', nosend: 1,
            formula: d => {
                var birthDate = new Date(d.birthday), now = new Date();
                return now.getFullYear() - birthDate.getFullYear() -
                    (now.setFullYear(2000) < birthDate.setFullYear(2000));
            }
        }
    },

    filter: {
        hasFilter: true,
        filters: [
            {field: 'weight', condition: 'less', value: 80, use: 1},
            {field: 'age', condition: 'more', value: 30, use: 1},
        ]
    }
}

ReactDOM.render(<EditableTable state={tableTest} />, document.getElementById('root'));
