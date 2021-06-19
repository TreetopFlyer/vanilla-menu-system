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
            inConfig.HandlerStart(t, inEvent);
        }
        else
        {
            first= false;
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
function DetectAway(inConfig)
{
    function handleClick(inEvent)
    {
        var i, roots, root, matches;
        roots = document.querySelectorAll("["+inConfig.AttributeRoot+"]");
        matches = [];
        if(roots)
        {
            for(i=0; i<roots.length; i++)
            {
                root = roots[i];
                if(root.contains(inEvent.target))
                {
                    matches.push(root);
                }
                else
                {
                    inConfig.HandlerAway(root, inEvent);
                }
            }
            if(matches.length)
            {
                inConfig.HandlerInside(matches, inEvent);
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
        var menu, button, mode, size;
        menu = inBranch.querySelector("["+Attributes.Menu+"]");
        button = inBranch.querySelector("["+Attributes.Button+"]");
        var stateOriginal = GetState(menu);
        mode = inMode==null ? !stateOriginal : inMode;
        if(mode == stateOriginal){return;}

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
        HandlerStart:function(inMenu, inEvent){},
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

    document.addEventListener("click", function(inEvent)
    {
        var toggleBranch = false;
        var toggleMode;
        if(inEvent.target.hasAttribute(Attributes.Button))
        {
            Traverse(inEvent.target, false, Attributes.Branch, function(inBranch)
            {
                toggleBranch = inBranch;
                toggleMode = Collapse(inBranch, null);
                return true;
            });
        }

        var roots = document.querySelectorAll("["+Attributes.Root+"]");
        var root;
        var last;
        var i;
        for(i=0; i<roots.length; i++)
        {
            /*
            root cannot collapse if:
            - it contains the event target
            - a parent menu is already collapsing
            - a parent root is also eligible for collapse
            */
            root = roots[i];
            if(!root.contains(inEvent.target))
            {
                // this root is eligible for collapse

                // check if there are any parent roots that are also eligible for collapse
                last = root;
                Traverse(root, false, Attributes.Root, function(inParentRoot)
                {
                    if(!inParentRoot.contains(inEvent.target))
                    {
                        last = inParentRoot;
                    }
                });

                // check if the collapse is already happening above
                var isAlreadyCollapsing = false;
                Traverse(last, false, Attributes.Root, function(inParentRoot)
                {
                    if(inParentRoot == toggleBranch)
                    {
                        isAlreadyCollapsing = true;
                        return true;
                    }
                });
                if(!isAlreadyCollapsing)
                {
                    Collapse(last, false);
                }
            }
        }
    });
    /*
    DetectAway({
        AttributeRoot:Attributes.Root,
        HandlerInside:function(inRoot, inEvent)
        {
            if(!inEvent.target.hasAttribute(Attributes.Button)){ return; }
            Traverse(inEvent.target, false, Attributes.Branch, function(inBranch)
            {
                console.log("      ...toggling", inBranch.id);
                Collapse(inBranch, null);
                return true;
            });
        },
        HandlerAway:function(inRoot, inEvent)
        {   
            //console.log("  ...collapsing", inRoot.id);
            Collapse(inRoot, false);
        }
    });
    */
}