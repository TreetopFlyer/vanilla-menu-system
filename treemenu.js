function DetectTransition(inConfig)
{
    var isValid = function(inTarget){return }
    var handleRun = function(inEvent)
    {
        var t, keys, first;
        t = inEvent.target;
        if(!t.hasAttribute(inConfig.AttributeCheck)){return;}
        keys = t.getAttribute(inConfig.AttributeWrite);
        if(!keys || keys == "")
        {
            first = true;
            keys = {};
        }
        else
        {
            first= false;
            keys = JSON.parse(keys);
        }
        if(keys[inEvent.propertyName]){return;}
        keys[inEvent.propertyName] = true;
        t.setAttribute(inConfig.AttributeWrite, JSON.stringify(keys));
        if(first){inConfig.HandlerStart(t, inEvent);}
    };
    var handleEnd = function(inEvent)
    {
        var t, keys, key;
        t = inEvent.target;
        if(!t.hasAttribute(inConfig.AttributeCheck)){return;}
        keys = t.getAttribute(inConfig.AttributeWrite);
        keys = JSON.parse(keys);
        keys[inEvent.propertyName] = false;
        for(key in keys)
        {
            if(keys[key] == true)
            {
                t.setAttribute(inConfig.AttributeWrite, JSON.stringify(keys));
                return;
            }
        }
        t.setAttribute(inConfig.AttributeWrite, "");
        inConfig.HandlerStop(t, inEvent);
    };
    document.addEventListener("transitionrun", handleRun);
    document.addEventListener("transitionend", handleEnd);
    return function()
    {
        document.removeEventListener("transitionrun", handleRun);
        document.removeEventListener("transitionend", handleEnd);
    };
}
function DetectAway(inConfig)
{
    function handleClick(inEvent)
    {
        var i, roots;
        roots = document.querySelectorAll("["+inConfig.AttributeRoot+"]");
        if(roots)
        {
            for(i=0; i<roots.length; i++)
            {
                (roots[i].contains(inEvent.target) ? inConfig.HandlerInside : inConfig.HandlerAway )(roots[i], inEvent);
            }
        }
    }
    document.addEventListener("click", handleClick);
    return function(){document.removeEventListener("click", handleClick);}
}
function TreeMenu(inAttributes)
{
    var Attributes = inAttributes;
    function SetStyle(inElement, inHeight, inTransition)
    {
        if(inTransition != null){ inElement.style.transition = inTransition; }
        inElement.style.height = inHeight;
    }
    function SetState(inElement, inOpen, inTransition)
    {
        if(inTransition == false){ inElement.setAttribute(Attributes.Live, ""); }
        inElement.setAttribute(Attributes.Open, inOpen);
    }
    function GetState(inElement, inTransition)
    {
        if(inTransition != null){ return inElement.getAttribute(Attributes.Live) != ""; }
        return inElement.getAttribute(Attributes.Open)=="true";
    }
    function Collapse(inBranch, inMode, inInstant)
    {
        var menu, button, mode, size;
        menu = inBranch.querySelector("["+Attributes.Menu+"]");
        button = inBranch.querySelector("["+Attributes.Button+"]");
        mode = inMode==null ? !GetState(menu) : inMode;
        size = (mode?menu.scrollHeight:0)+"px";
        if(inInstant)
        {
            SetState(menu, mode, false);
            SetStyle(menu, size, "none");
        }
        else
        {
            SetState(menu, mode);
            SetStyle(menu, menu.clientHeight+"px", "");
        }
        setTimeout(function(){ SetStyle(menu, size, ""); });
        SetState(button, mode);
    }
    function Traverse(inStart, inDirection, inAttribute, inHandler)
    {
        var collection, i;
        if(inDirection)
        {
            collection = inStart.querySelectorAll("["+inAttribute+"]")||[];
            for(i=0; i<collection.length; i++)
            {
                if(inHandler(collection[i])){ return; }
            }
        }
        else
        {
            i = inStart.parentNode;
            while(i != document)
            {
                if(i.hasAttribute(inAttribute))
                {
                    if(inHandler(i)){ return; }
                }
                i = i.parentNode;
            }
        }
    }
    DetectTransition({
        AttributeWrite: Attributes.Live,
        AttributeCheck: Attributes.Open,
        HandlerStart:function(inMenu, inEvent)
        {
            var heightParent, heightExtra;
            heightExtra = GetState(inMenu) ? parseInt(inMenu.style.height) : - inMenu.scrollHeight;
            Traverse(inMenu, false, Attributes.Menu, function(inParentMenu)
            {
                if(!GetState(inParentMenu, true)){ return; }
                heightParent = parseInt(inParentMenu.style.height);
                SetStyle(inParentMenu, heightParent+heightExtra+"px", "");
            });
        },
        HandlerStop:function(inMenu, inEvent)
        {
            if(GetState(inMenu))
            {
                SetStyle(inMenu, "auto", "");
            }
            else
            {
                Traverse(inMenu, true, Attributes.Branch, function(inBranch){ Collapse(inBranch, false, true); });
            }
        }
    });
    DetectAway({
        AttributeRoot:Attributes.Root,
        HandlerInside:function(inRoot, inEvent)
        {
            if(!inEvent.target.hasAttribute(Attributes.Button)){ return; }
            Traverse(inEvent.target, false, Attributes.Branch, function(inBranch){ Collapse(inBranch, null); return true; });
        },
        HandlerAway:function(inRoot, inEvent)
        {
            Collapse(inRoot, false);
        }
    });
}