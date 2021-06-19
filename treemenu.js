function DetectTransition(inConfig)
{
    var isValid = function(inTarget){return }
    var handleRun = function(inEvent)
    {
        var t, keys;
        t = inEvent.target;
        if(!t.hasAttribute(inConfig.AttributeCheck)){return;}
        keys = t.getAttribute(inConfig.AttributeWrite);
        if(!keys || keys == "")
        {
            keys = {};
        }
        else
        {
            keys = JSON.parse(keys);
        }
        if(keys[inEvent.propertyName]){return;}
        keys[inEvent.propertyName] = true;
        t.setAttribute(inConfig.AttributeWrite, JSON.stringify(keys));
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
    function InterruptParents(inMenu)
    {
        var heightParent, heightExtra;
        heightExtra = GetState(inMenu) ? parseInt(inMenu.style.height) : - inMenu.scrollHeight;
        Traverse(inMenu, false, Attributes.Menu, function(inParentMenu)
        {
            if(!GetState(inParentMenu, true)){ return; }
            console.log("Height Adjust", heightExtra, inParentMenu);
            heightParent = parseInt(inParentMenu.style.height);
            SetStyle(inParentMenu, heightParent+heightExtra+"px", "");
        });
    }
    function Collapse(inBranch, inMode, inInstant)
    {
        var menu, button, mode, size, state;
        menu = inBranch.querySelector("["+Attributes.Menu+"]");
        button = inBranch.querySelector("["+Attributes.Button+"]");
        state = GetState(menu);
        if(inMode == state){return;}
        mode = inMode==null ? !state : inMode;
        
        size = (mode?menu.scrollHeight:0)+"px";
        if(inInstant)
        {
            SetState(menu, mode, false);
            SetStyle(menu, size, "none");
            setTimeout(function(){ SetStyle(menu, size, ""); });
        }
        else
        {
            SetState(menu, mode);
            SetStyle(menu, menu.clientHeight+"px", "");
            setTimeout(function(){
                SetStyle(menu, size, "");
                InterruptParents(menu);
            });
        }
        
        SetState(button, mode);
        return mode;
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
            while(i != document.body)
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
    function HandleClick(inEvent)
    {
        var toggleBranch, activeCollapse, roots, root, i;

        if(inEvent.target.hasAttribute(Attributes.Button))
        {
            Traverse(inEvent.target, false, Attributes.Branch, function(inBranch)
            {
                toggleBranch = inBranch;
                Collapse(inBranch, null);
                return true;
            });
        }

        roots = document.querySelectorAll("["+Attributes.Root+"]");
        for(i=0; i<roots.length; i++)
        {
            root = roots[i];
            if(!root.contains(inEvent.target))
            {
                Traverse(root, false, Attributes.Root, function(inParentRoot)
                {
                    if(!inParentRoot.contains(inEvent.target))
                    {
                        root = inParentRoot;
                    }
                    else
                    {
                        return true;
                    }
                });

                var activeCollapse = false;
                Traverse(root, false, Attributes.Root, function(inParentRoot)
                {
                    if(inParentRoot == toggleBranch)
                    {
                        activeCollapse = true;
                        return true;
                    }
                });
                if(!activeCollapse)
                {
                    Collapse(root, false);
                }
            }
        }
    }
    document.addEventListener("click", HandleClick);
    return function(){ document.removeEventListener("click", HandleClick); }
}